
export interface SingleFilter {
  field: string
  operator_field: OpField
  value: string|number
}

// Operators for single_filter
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
  GEO = '$geoNear' // {field: JSON.stringify([long,lat]), value: maxDistance, operator: OpField.GEO}
}

export interface CombinedFilter {
  filter_elements: SingleFilter[]
  operator: Operator
}

// Operators for combined_filter
export enum Operator {
  AND = "$and",
  OR = "$or",
  NOR = "$nor"
}


/**
 * AppHttpParams
 */

export type FilterParams = SingleFilter | CombinedFilter

export enum SortWay {
  ASC = 1,
  DESC = -1
}

export interface SortParams {
  field: string
  way: SortWay
}

export interface AppHttpParams {
  nbr?: number
  page_nbr?: number
  filters?: FilterParams
  sort?: SortParams
}
