#!/usr/bin/env node

/**
 * データベース初期化スクリプト
 * このスクリプトはNeonデータベースのテーブルとインデックスを作成します
 */

require('dotenv').config();
const { Pool } = require('pg');

function assertValidDatabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('環境変数 DATABASE_URL が未設定、または無効です。Neonの接続文字列を設定してください。');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    throw new Error('DATABASE_URL の形式が不正です。Neonの接続文字列をそのまま貼り付けてください。');
  }
  if (!parsed.username) {
    throw new Error('DATABASE_URL にユーザー名が含まれていません。Neonの接続文字列を確認してください。');
  }
  // パスワード未設定や空文字の場合に備えてチェック
  // 特殊文字が含まれる場合は URL エンコードが必要です（例: @, :, / など）
  if (parsed.password == null || parsed.password === '') {
    throw new Error('DATABASE_URL にパスワードが含まれていません。Neonの接続文字列を確認するか、パスワードに特殊文字が含まれる場合はURLエンコードしてください。');
  }
}

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  assertValidDatabaseUrl(connectionString);

  // Neon は常に SSL 必須。証明書検証を有効にする
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  try {
    console.log('🔧 データベース初期化を開始します...');
    
    // pgvector拡張を有効化
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector拡張を有効化しました');
    
    // メニューテーブルの作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        metadata JSONB,
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ menusテーブルを作成しました');
    
    // インデックスの作成（ベクトル検索用）
    await pool.query(`
      CREATE INDEX IF NOT EXISTS menus_embedding_idx 
      ON menus 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ ベクトル検索用インデックスを作成しました');
    
    // メニューデータテーブルの作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_data (
        id VARCHAR(255) PRIMARY KEY,
        menu_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ menu_dataテーブルを作成しました');
    
    console.log('🎉 データベース初期化が完了しました！');
    
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
