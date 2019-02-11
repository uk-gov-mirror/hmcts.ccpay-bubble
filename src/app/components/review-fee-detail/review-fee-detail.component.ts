import { Component } from '@angular/core';
import { AddFeeDetailService } from 'src/app/services/add-fee-detail/add-fee-detail.service';
import { Router } from '@angular/router';
import { FeeModel } from 'src/app/models/FeeModel';

@Component({
  selector: 'app-review-fee-detail',
  templateUrl: './review-fee-detail.component.html',
  styleUrls: ['./review-fee-detail.component.scss']
})
export class ReviewFeeDetailComponent {
  fee: FeeModel = this.addFeeDetailService.selectedFee;
  display_fee_amount: string;
  display_amount_to_pay: string;
  paymentReference = '';
  paymentGroupReference = '';
  error: string;
  resultData: any;

  constructor(
    private router: Router,
    private addFeeDetailService: AddFeeDetailService
  ) { }

  get payModel() {
    return this.addFeeDetailService.paymentModel;
  }

  get remissionModel() {
    return this.addFeeDetailService.remissionModel;
  }

  sendPayDetailsToPayhub() {
    this.addFeeDetailService.sendPayDetailsToPayhub()
    .then(sendCardPayments => {
      this.resultData = JSON.parse(sendCardPayments);
      this.paymentReference = this.resultData.data.reference;
      this.paymentGroupReference = this.resultData.data.payment_group_reference;
    })
    .catch(err => {
      this.error = err;
    });
  }

  onGoBack() {
    return this.router.navigateByUrl('/addFeeDetail');
  }
}