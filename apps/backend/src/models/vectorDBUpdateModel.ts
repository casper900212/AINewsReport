import VectorDBUpdate from '../db/entity/VectorDBUpdate'
import { SuccessResponseModel } from './commonModel'

export interface LogVectorDBUpdateResponseModel extends SuccessResponseModel {
  data: VectorDBUpdate
}

export interface GetLatestVectorDBUpdateResponseModel extends SuccessResponseModel {
  data: {
    /**
     * 向量資料庫最後更新時間
     */
    updateAt: Date
  } | null
}
