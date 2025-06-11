import { Controller, Get, Post, Response, Route, Tags } from 'tsoa'
import { ExpectedErrorResponseModel, UnexpectedErrorResponseModel } from '../models'
import { GetLatestVectorDBUpdateResponseModel, LogVectorDBUpdateResponseModel } from '../models/vectorDBUpdateModel'
import { logVectorDBUpdate, getLatestVectorDBUpdate } from '../services/vectorDBUpdateService'
import { sendOk } from '../utils/routeHelper'

@Tags('VectorDBUpdate')
@Route('vdb-update')

export class VectorDBUpdateController extends Controller {
  /**
   * @summary [CLI] 新增向量資料庫更新時間
   */
  @Post('/')
  @Response<LogVectorDBUpdateResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async createVectorDBUpdateTime (): Promise<LogVectorDBUpdateResponseModel> {
    const data = await logVectorDBUpdate()
    return sendOk({ data })
  }

  /**
   * @summary 取得向量資料庫最後更新時間
   */
  @Get('/latest')
  @Response<GetLatestVectorDBUpdateResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async getVectorDBLastUpdateTime (): Promise<GetLatestVectorDBUpdateResponseModel> {
    const latest = await getLatestVectorDBUpdate()
    return sendOk({ data: latest })
  }
}
