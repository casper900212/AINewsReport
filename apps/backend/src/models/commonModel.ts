export interface SuccessResponseModel {
  /**
   * 成功狀態
   */
  status: 'Success'
}

export interface ExpectedErrorResponseModel {
  /**
   * 預期錯誤
   */
  status:
  | 'UnauthorizedError'
  | 'ValidateError'
  | 'AppError'
  | 'ParamsError'
  | 'UnauthorizedError'
  | 'ForbiddenError'
  | 'NotFoundError'
  | 'DataExistError'
  | 'DatabaseError'
  | 'AwsError'
  | 'ApiCallError'

  /**
   * 錯誤訊息
   */
  message: string
}

export interface UnexpectedErrorResponseModel {
  /**
   * 未知錯誤
   */
  status: string

  /**
   * 錯誤訊息
   */
  message: string
}
