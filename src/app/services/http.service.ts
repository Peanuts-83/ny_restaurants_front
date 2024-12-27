import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { AppHttpParams, CombinedFilter, Operator, OpField, SingleFilter } from '../models/filter-params.interface'

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

  public setFilter(a_field: string, a_value:string, a_filters?: SingleFilter|CombinedFilter): SingleFilter|CombinedFilter|undefined {
    if (!a_filters) {
      return <SingleFilter>{
        field: a_field,
        operator_field: OpField.EQ,
        value: a_value
      }
    } else if (Object.keys(a_filters).includes('field')) {
    // SingleFilter > pass to CombinedFilter
     const result =  <CombinedFilter>{
      filter_elements: [
        <SingleFilter>a_filters,
        {
          field: a_field,
          operator_field: OpField.EQ,
          value: a_value}
      ],
      operator: Operator.AND
     };
     (<CombinedFilter>result).filter_elements = result.filter_elements.filter((f,i,arr)=> !arr.slice(i+1).some(el => el.field===f.field))
     return result
    } else {
      // CombinedFilter
      const result = {
        filter_elements: [...(<CombinedFilter>a_filters).filter_elements,
          {
            field: a_field,
            operator_field: OpField.EQ,
            value: a_value}
        ],
        operator: Operator.AND
      };
      (<CombinedFilter>result).filter_elements = result.filter_elements.filter((f,i,arr)=> !arr.slice(i+1).some(el => el.field===f.field))
      return result
    }
  }

  public unsetFilter(a_field: string, a_filters?: SingleFilter|CombinedFilter): SingleFilter|CombinedFilter|undefined {
    if (!a_filters || (a_filters && Object.keys(a_filters).includes('field'))) {
      // SingleFilter
      return undefined
    } else {
      // CombinedFilter
      (<CombinedFilter>a_filters).filter_elements = (<CombinedFilter>a_filters).filter_elements.filter(f => f.field!==a_field)
      return a_filters
    }
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
