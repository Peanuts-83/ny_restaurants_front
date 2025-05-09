import { Injectable } from "@angular/core"
import { HttpService } from "./http.service"
import { AppHttpParams } from "../models/filter-params.interface"
import { Observable } from "rxjs"

@Injectable({providedIn:'root'})
export abstract class BaseApiService {
  public abstract apiConf: { baseApi: string }

  constructor(public httpService: HttpService) {}

  public doPost<T>(url:string, params:AppHttpParams): Observable<HTTPResponse<T>> {
    return this.httpService.post<T>(url, params)
  }
}

export interface HTTPResponse<T> {
  data: T
  page_nbr?: number
}
