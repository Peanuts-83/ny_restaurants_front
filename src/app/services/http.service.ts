import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { AppHttpParams } from '../models/filter-params.interface'

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl = 'http://127.0.0.1:8000'
  private requestOptions = { withCredentials: true}

  constructor(private http: HttpClient) { }

  public post<T>(a_url:string, a_params?: AppHttpParams): Observable<T> {
    return this.http.post<T>(this.baseUrl + a_url, {params: a_params}, this.requestOptions)
  }

}


export namespace API {
  // Restaurant routes
  export enum RestaurantApi {
    GETONE = '/one',
    LIST = '/list',
    DISTINCT = '/distinct',
    CREATE = '/create',
    UPDATE = '/update',
    DELETE = '/delete'
  }
  // Borough routes
  export enum NeighborhoodApi {
    BRH_GETONE = '/neighborhood/one',
    BRH_LIST = '/neighborhood/list',
    BRH_DISTINCT = '/neighborhood/distinct',
    BRH_UPDATE = '/neighborhood/update',
  }
  // Point routes
  export enum PointApi {
    PT_FROM_BRH = '/point/from_neighborhood',
    PT_TO_REST = '/point/to_restaurant',
    PT_TO_REST_WITHIN = '/point/to_restaurant_within'
  }
}

export namespace OPERATOR {
  export enum OpField {
    EQ = "$eq",
    NE = "$ne",
    CONTAIN = "$regex",
    IN = "$in",
    NOT_IN = "$nin",
    GT = "$gt",
    GTE = "$gte",
    LT = "$lt",
    LTE = "$lte",
    NOT = "$not",
  }
  export enum OpCombined {
    AND = "$and",
    OR = "$or",
    NOR = "$nor",
  }
}
