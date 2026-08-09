
import {UsersEntity} from '../../users/entities/users.entity'
import {OrdersEntity} from '../../orders/entities/orders.entity'


export class AddressesEntity {
  id: string ;
user_id: string ;
recipient_name: string ;
phone: string ;
street: string ;
ward: string  | null;
district: string  | null;
city: string ;
is_default: boolean ;
user?: UsersEntity ;
orders?: OrdersEntity[] ;
}
