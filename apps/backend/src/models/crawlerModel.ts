import Crawler from '../db/entity/Crawler'
import { SuccessResponseModel } from './commonModel'

export interface CreateCrawlerModel {
  /**
   * 爬蟲來源名稱 e.g. iThome
   */
  name: string
  /**
   * 爬蟲腳本檔案名稱 e.g. iThome.js
   */
  scriptFilename: string
  /**
   * 是否啟用爬蟲
   */
  enabled: boolean
}

export interface CreateCrawlerResponseModel extends SuccessResponseModel {
  data: Crawler
}

export interface GetCrawlerListResponseModel extends SuccessResponseModel {
  data: Crawler[]
}

export interface UpdateCrawlerModel {
  /**
   * 爬蟲來源名稱 e.g. iThome
   */
  name?: string
  /**
   * 是否啟用爬蟲
   */
  enabled?: boolean
}

export interface RunCrawlerModel {
  /**
   * 開始年月 YYYY-MM
   * @example '2025-05'
   */
  start: string

  /**
   * 結束年月 YYYY-MM
   * @example '2025-05'
   */
  end: string
}

export interface RunCrawlerResponseModel extends SuccessResponseModel {
  data: {
    /**
     * 爬取的資料筆數
     */
    count: number

    /**
     * 執行狀態
     */
    status: 'success' | 'error'
  }
}
