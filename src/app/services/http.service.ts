import { FilterParams } from './../models/filter-params.interface'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { AppHttpParams, CombinedFilter, Operator, OpField, SingleFilter } from '../models/filter-params.interface'
import { HTTPResponse } from './base-api.service'

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl = 'http://127.0.0.1:8000'
  private requestOptions = { withCredentials: true }

  constructor(private http: HttpClient) { }

  public post<T>(a_url: string, a_params?: AppHttpParams): Observable<HTTPResponse<T>> {
    return this.http.post<HTTPResponse<T>>(this.baseUrl + a_url, { params: a_params }, this.requestOptions)
  }

  /**
   * Add a filter to filters
   * @param a_field
   * @param a_value
   * @param a_filters
   * @returns SingleFilter|CombinedFilter|undefined
   */
  public setFilter(a_field: any, a_value: string | number, a_operatorField?: OpField, a_filters?: SingleFilter | CombinedFilter): SingleFilter | CombinedFilter | undefined {
    // cuisine & borough filters erase name filter
    if (['borough', 'cuisine'].includes(a_field) && a_filters) {
      if ((<SingleFilter>a_filters).field && (<SingleFilter>a_filters).field === 'name') {
        a_filters = undefined
      } else if ((<CombinedFilter>a_filters).filter_elements) {
        (<CombinedFilter>a_filters).filter_elements = (<CombinedFilter>a_filters).filter_elements.filter(f => f.field !== 'name')
      }
    }
    if (!a_filters) {
      // no filter > create Singlefilter
      return <SingleFilter>{
        field: a_field,
        operator_field: a_operatorField || OpField.EQ,
        value: a_value
      }
    } else if (Object.keys(a_filters).includes('field')) {
      // SingleFilter > pass to CombinedFilter
      const result = <CombinedFilter>{
        filter_elements: [
          <SingleFilter>a_filters,
          {
            field: a_field,
            operator_field: a_operatorField || OpField.EQ,
            value: a_value
          }
        ],
        operator: Operator.AND
      };
      // no duplicates & last kept first
      (<CombinedFilter>result).filter_elements = result.filter_elements.filter((f, i, arr) => !arr.slice(i + 1).some(el => el.field === f.field))
      return result
    } else {
      // CombinedFilter
      const result = {
        filter_elements: [...(<CombinedFilter>a_filters).filter_elements,
        {
          field: a_field,
          operator_field: a_operatorField || OpField.EQ,
          value: a_value
        }
        ],
        operator: Operator.AND
      };
      // no duplicates & last kept first
      (<CombinedFilter>result).filter_elements = result.filter_elements.filter((f, i, arr) => !arr.slice(i + 1).some(el => el.field === f.field))
      return result
    }
  }

  /**
   * Remove a filter to filters
   * @param a_field
   * @param a_filters
   * @returns SingleFilter|CombinedFilter|undefined
   */
  public unsetFilter(a_field: string, a_filters?: SingleFilter | CombinedFilter): SingleFilter | CombinedFilter | undefined {
    if (!a_filters || (a_filters && Object.keys(a_filters).includes('field'))) {
      // SingleFilter
      return undefined
    } else {
      // CombinedFilter
      (<CombinedFilter>a_filters).filter_elements = (<CombinedFilter>a_filters).filter_elements.filter(f => f.field !== a_field)
      let l_filters = <CombinedFilter>a_filters
      if (l_filters.filter_elements.length > 1) {
        return l_filters
      } else if (l_filters.filter_elements.length > 0) {
        return <SingleFilter>{
          field: l_filters.filter_elements[0].field,
          operator_field: l_filters.filter_elements[0].operator_field,
          value: l_filters.filter_elements[0].value,
        }
      }
      return undefined
    }
  }

  /**
   * Is a specific filter available in filters
   * @param a_field
   * @param a_filters
   * @returns boolean
   */
  public isFilter(a_field: string, a_filters?: SingleFilter | CombinedFilter): boolean {
    if (!a_filters) {
      return false
    } else {
      if (Object.keys(a_filters).includes('field')) {
        // SingleFilter
        return (<SingleFilter>a_filters).field === a_field
      } else {
        // CombinedFilter
        return (<CombinedFilter>a_filters).filter_elements.some(f => f.field === a_field)
      }
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
