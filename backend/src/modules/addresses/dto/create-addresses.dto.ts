





export class CreateAddressesDto {
  recipient_name!: string;
  phone!: string;
  street!: string;
  ward?: string;
  district?: string;
  city!: string;
}
