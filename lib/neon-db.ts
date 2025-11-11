import { Pool } from 'pg';

// Neonデータベース接続（遅延初期化）
let pool: Pool;
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('環境変数 DATABASE_URL が未設定です。Neon の接続文字列を設定してください。');
    }
    // Neon は常に SSL 必須
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

function formatEmbeddingForPgvector(embedding: number[]): string {
  if (!Array.isArray(embedding)) {
    throw new Error('埋め込みベクトルが配列ではありません');
  }
  const sanitized = embedding.map((value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return n;
  });
  return `[${sanitized.join(',')}]`;
}

// データベース初期化
export async function initDatabase() {
  try {
    // pgvector拡張を有効化
    await getPool().query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // メニューテーブルの作成
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS menus (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        metadata JSONB,
        embedding vector(1536),
        file_type VARCHAR(100),
        file_size VARCHAR(50),
        file_url TEXT,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // 既存のテーブルに新しいカラムを追加（存在しない場合のみ）
    try {
      await getPool().query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);`);
      await getPool().query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS file_size VARCHAR(50);`);
      await getPool().query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS file_url TEXT;`);
      await getPool().query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS content TEXT;`);
    } catch (error) {
      // カラムが既に存在する場合はエラーを無視
      console.log('[Neon] カラム追加をスキップ（既に存在）');
    }
    
    // インデックスの作成（ベクトル検索用）
    await getPool().query(`
      CREATE INDEX IF NOT EXISTS menus_embedding_idx 
      ON menus 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    
    // メニューデータテーブルの作成
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS menu_data (
        id VARCHAR(255) PRIMARY KEY,
        menu_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('[Neon]  データベース初期化完了');
  } catch (error) {
    console.error('[Neon]  データベース初期化エラー:', error);
    throw error;
  }
}

// メニューの保存
export async function saveMenu(
  menuId: string, 
  menuData: any, 
  embedding?: number[],
  metadata?: any
) {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // メニューデータを保存
    await client.query(
      'INSERT INTO menu_data (id, menu_data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET menu_data = $2',
      [menuId, JSON.stringify(menuData)]
    );
    
    // メニューメタデータとembeddingを保存
    if (embedding) {
      const vectorLiteral = formatEmbeddingForPgvector(embedding);
      await client.query(
        `INSERT INTO menus (id, title, description, metadata, embedding) 
         VALUES ($1, $2, $3, $4, $5::vector) 
         ON CONFLICT (id) DO UPDATE SET 
           title = $2, 
           description = $3, 
           metadata = $4, 
           embedding = $5::vector,
           updated_at = NOW()`,
        [
          menuId,
          metadata?.title || 'Untitled',
          metadata?.description || '',
          JSON.stringify(metadata || {}),
          vectorLiteral
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log(`[Neon]  メニュー ${menuId} を保存しました`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Neon]  メニュー保存エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ベクトル検索による類似メニュー検索
export async function searchSimilarMenus(
  queryEmbedding: number[], 
  limit: number = 5,
  duration?: number
): Promise<Array<{id: string, metadata: any, similarity: number}>> {
  try {
    let query = `
      SELECT 
        id, 
        metadata, 
        1 - (embedding <=> $1::vector) as similarity
      FROM menus 
      WHERE embedding IS NOT NULL
    `;
    
    const vectorLiteral = formatEmbeddingForPgvector(queryEmbedding);
    const params: any[] = [vectorLiteral];
    
    // 時間での絞り込み
    if (duration) {
      query += ` AND metadata->>'duration' ~ '^[0-9]+$' 
                 AND CAST(metadata->>'duration' AS INTEGER) BETWEEN $2 AND $3`;
      const minDuration = Math.floor(duration * 0.8);
      const maxDuration = Math.ceil(duration * 1.2);
      params.push(minDuration, maxDuration);
    }
    
    query += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await getPool().query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      metadata: row.metadata,
      similarity: parseFloat(row.similarity)
    }));
  } catch (error) {
    console.error('[Neon]  類似メニュー検索エラー:', error);
    return [];
  }
}

// アップロードファイルの保存
export async function saveUploadedFile(
  menuId: string,
  title: string,
  description: string,
  fileType: string,
  fileSize: string,
  fileUrl?: string,
  content?: string
) {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // menusテーブルにアップロードファイル情報を保存
    await client.query(
      `INSERT INTO menus (id, title, description, file_type, file_size, file_url, content) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET 
         title = $2, 
         description = $3, 
         file_type = $4, 
         file_size = $5, 
         file_url = $6, 
         content = $7,
         updated_at = NOW()`,
      [menuId, title, description, fileType, fileSize, fileUrl || null, content || null]
    );
    
    await client.query('COMMIT');
    console.log(`[Neon]  アップロードファイル ${menuId} を保存しました`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Neon]  アップロードファイル保存エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

// アップロードファイルの取得
export async function getUploadedFile(menuId: string): Promise<any | null> {
  try {
    const result = await getPool().query(
      'SELECT id, title, description, file_type, file_size, file_url, content, created_at FROM menus WHERE id = $1',
      [menuId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      fileType: row.file_type,
      fileSize: row.file_size,
      fileUrl: row.file_url,
      content: row.content,
      createdAt: row.created_at
    };
  } catch (error) {
    console.error('[Neon]  アップロードファイル取得エラー:', error);
    return null;
  }
}

// メニューデータの取得
export async function getMenu(menuId: string): Promise<any | null> {
  try {
    const result = await getPool().query(
      'SELECT menu_data FROM menu_data WHERE id = $1',
      [menuId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].menu_data;
  } catch (error) {
    console.error('[Neon]  メニュー取得エラー:', error);
    return null;
  }
}

// すべてのメニュー履歴を取得
export async function getMenuHistory(): Promise<Array<{
  id: string;
  title: string;
  description: string;
  fileType?: string;
  fileSize?: string;
  createdAt: string;
}>> {
  try {
    const result = await getPool().query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.file_type,
        m.file_size,
        m.created_at
      FROM menus m
      ORDER BY m.created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      description: row.description || '',
      fileType: row.file_type,
      fileSize: row.file_size,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('[Neon]  メニュー履歴取得エラー:', error);
    return [];
  }
}

// テストデータ（mock-で始まるID）を削除
export async function deleteTestMenus(): Promise<number> {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // menu_dataテーブルからテストデータを削除
    const menuDataResult = await client.query(
      "DELETE FROM menu_data WHERE id LIKE 'mock-%'"
    );
    
    // menusテーブルからテストデータを削除
    const menusResult = await client.query(
      "DELETE FROM menus WHERE id LIKE 'mock-%'"
    );
    
    await client.query('COMMIT');
    
    const deletedCount = (menuDataResult.rowCount || 0) + (menusResult.rowCount || 0);
    console.log(`[Neon]  テストデータ ${deletedCount} 件を削除しました`);
    
    return deletedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Neon]  テストデータ削除エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 個別メニューを削除
export async function deleteMenu(menuId: string): Promise<{ success: boolean }> {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // menu_dataテーブルから削除
    await client.query(
      'DELETE FROM menu_data WHERE id = $1',
      [menuId]
    );
    
    // menusテーブルから削除
    await client.query(
      'DELETE FROM menus WHERE id = $1',
      [menuId]
    );
    
    await client.query('COMMIT');
    console.log(`[Neon]  メニュー ${menuId} を削除しました`);
    
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Neon]  メニュー削除エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

// データベース接続を閉じる
export async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}
