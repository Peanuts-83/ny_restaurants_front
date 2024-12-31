import { BaseApiService } from "../services/base-api.service"
import { AppHttpParams } from "./filter-params.interface"

export interface InputConf {
  service: BaseApiService
  params: AppHttpParams
  formControl: string
}

export interface SelectConf extends InputConf {
  isMulti?: boolean
}
