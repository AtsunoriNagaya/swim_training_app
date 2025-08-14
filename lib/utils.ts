import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 距離文字列または数値から数値を抽出する関数
 * @param distance - 距離を表す文字列（例: "100m", "50", "200メートル"）または数値
 * @returns 数値（単位なし）
 */
export function extractDistance(distance: string | number): number {
  // 数値の場合はそのまま返す
  if (typeof distance === 'number') {
    return distance;
  }
  
  // 文字列の場合は数値のみを抽出（単位は無視）
  const match = distance.match(/^(\d+)/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  return isNaN(value) ? 0 : value;
}

/**
 * 合計距離を計算する関数
 * @param distance - 距離を表す文字列または数値
 * @param sets - 本数
 * @returns 合計距離（数値）
 */
export function calculateTotalDistance(distance: string | number, sets: number): number {
  const baseDistance = extractDistance(distance);
  return baseDistance * sets;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
