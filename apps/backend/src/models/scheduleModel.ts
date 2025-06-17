import Schedule from '../db/entity/Schedule'
import { SuccessResponseModel } from './commonModel'

export interface UpsertScheduleResponseModel extends SuccessResponseModel {
  data: Schedule
}

export interface GetScheduleResponseModel extends SuccessResponseModel {
  data: {
    /**
     * 排程
     */
    cron: string
  } | null
}
