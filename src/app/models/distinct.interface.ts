export interface Distinct {
  name: string
  coord?: number[]
}

export interface DistinctRestaurant extends Distinct {
  cuisine:string
  borough:string
  street: string
}
