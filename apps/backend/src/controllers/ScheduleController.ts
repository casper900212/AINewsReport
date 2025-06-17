import { Body, Controller, Get, Post, Response, Route, Tags } from 'tsoa'
import {
  ExpectedErrorResponseModel,
  GetScheduleResponseModel,
  UnexpectedErrorResponseModel,
  UpsertScheduleResponseModel,
} from '../models'
import { getSchedule, upsertSchedule } from '../services'
import { sendOk } from '../utils/routeHelper'

@Tags('Schedule')
@Route('schedule')
export class ScheduleController extends Controller {
  /**
   * @summary 設定排程
   */
  @Post('/')
  @Response<UpsertScheduleResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async upsertSchedule (
    @Body() requestBody: { cron: string },
  ): Promise<UpsertScheduleResponseModel> {
    const schedule = await upsertSchedule(requestBody.cron)
    return sendOk({ data: schedule })
  }

  /**
   * @summary 取得排程
   */
  @Get('/')
  @Response<GetScheduleResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async getSchedule (): Promise<GetScheduleResponseModel> {
    const { cron } = await getSchedule()
    return sendOk({
      data: { cron },
    })
  }
}
