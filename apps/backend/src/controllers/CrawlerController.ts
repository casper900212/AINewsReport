import { Body, Controller, Delete, Get, Patch, Path, Post, Response, Route, Tags } from 'tsoa'
import {
  CreateCrawlerModel,
  CreateCrawlerResponseModel,
  ExpectedErrorResponseModel,
  GetCrawlerListResponseModel,
  RunCrawlerModel,
  SuccessResponseModel,
  UnexpectedErrorResponseModel,
  UpdateCrawlerModel,
} from '../models'
import { createCrawler, deleteCrawler, executeCrawler, getCrawlerList, updateCrawler } from '../services'
import { sendOk } from '../utils/routeHelper'

@Tags('Crawler')
@Route('crawler')
export class CrawlerController extends Controller {
  /**
   * @summary [CLI] 將爬蟲來源資訊寫入 DB
   */
  @Post('/')
  @Response<CreateCrawlerResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async createCrawler (
    @Body() requestBody: CreateCrawlerModel,
  ): Promise<CreateCrawlerResponseModel> {
    const crawler = await createCrawler(requestBody)
    return sendOk({ data: crawler })
  }

  /**
   * @summary 取得爬蟲來源資訊列表
   */
  @Get('/')
  @Response<GetCrawlerListResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async getUserList (): Promise<GetCrawlerListResponseModel> {
    const crawler = await getCrawlerList()
    return sendOk({ data: crawler })
  }

  /**
   * @summary 更新爬蟲來源資訊
   */
  @Patch('{id}')
  @Response<SuccessResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async updateCrawler (
    @Path() id: number,
    @Body() requestBody: UpdateCrawlerModel,
  ): Promise<SuccessResponseModel> {
    await updateCrawler(id, requestBody)
    return sendOk()
  }

  /**
   * @summary [CLI] 刪除爬蟲來源資訊
   */
  @Delete('{id}')
  @Response<SuccessResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async deleteCrawler (
    @Path() id: number,
  ): Promise<SuccessResponseModel> {
    await deleteCrawler(id)
    return sendOk()
  }

  /**
   * @summary 執行爬蟲
   */
  @Post('{id}/run')
  @Response<SuccessResponseModel>(200)
  @Response<ExpectedErrorResponseModel>(400, 'Expected error')
  @Response<UnexpectedErrorResponseModel>(500, 'Unexpected error')
  public async runCrawler (
    @Path() id: number,
    @Body() requestBody: RunCrawlerModel,
  ): Promise<SuccessResponseModel> {
    const data = await executeCrawler(id, requestBody)
    return sendOk({ data })
  }
}
