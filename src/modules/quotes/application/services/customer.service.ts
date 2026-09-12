import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import {
  Customer,
  CustomerDocument,
} from "../../infrastructure/persistence/mongo/customers.schema";
import { createHmac } from "crypto";

interface CustomerData {
  email: string;
  name: string;
  phone: string;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
  ) {}

  public generateCustomerKey(email: string, secret: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    return createHmac("sha256", secret)
      .update(`email:${normalizedEmail}`)
      .digest("hex");
  }

  async findOrCreateCustomer(
    data: CustomerData,
    session?: ClientSession,
  ): Promise<CustomerDocument> {
    const customerKey = this.generateCustomerKey(
      data.email,
      process.env.CUSTOMER_KEY_SECRET || "default_secret",
    );

    const normalizedEmail = data.email.trim().toLowerCase();

    let customer = await this.customerModel
      .findOne({ email: normalizedEmail })
      .session(session || null)
      .exec();

    if (!customer) {
      customer = new this.customerModel({
        customerKey,
        email: normalizedEmail,
        name: data.name,
        phone: data.phone,
      });
      await customer.save({ session });
    }

    return customer;
  }
}
