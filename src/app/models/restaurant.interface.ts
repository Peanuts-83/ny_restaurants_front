import { Distinct } from "./distinct.interface"

export interface Restaurant extends Distinct {
  address: Address
  borough:string
  cuisine:string
  grades: Grade[]
  restaurant_id: string
}

export interface Address {
  building: string
  coord: number[]
  street: string
  zipcode: string
}

export interface Grade {
  date: string
  grade: string
  score: number
}
