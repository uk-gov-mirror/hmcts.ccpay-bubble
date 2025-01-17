import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit {
  apiRoot: string;
  bulkscanapiRoot: string;
  view: string;
  takePayment: boolean;
  ccdCaseNumber: string;
  excReference: string;
  paymentGroupRef: string;
  dcnNumber: string;
  selectedOption: string;
  isBulkscanningEnable: boolean;
  isStrategicFixEnable: boolean;
  isTurnOff: boolean;
  isOldPcipalOff: boolean;
  isNewPcipalOff: boolean;

  constructor(
    private activatedRoute: ActivatedRoute
    ) { }

  ngOnInit() {

      this.activatedRoute.params.subscribe((params) => {
      this.apiRoot = 'api/payment-history';
      this.bulkscanapiRoot = 'api/bulk-scan';
      this.ccdCaseNumber = params['ccdCaseNumber'];
      this.isBulkscanningEnable = this.activatedRoute.snapshot.queryParams['isBulkScanning'] === 'Enable';
      this.isStrategicFixEnable = this.activatedRoute.snapshot.queryParams['isStFixEnable'] === 'Enable';
      this.isTurnOff = this.activatedRoute.snapshot.queryParams['isTurnOff'] === 'Enable';
      this.isOldPcipalOff = this.activatedRoute.snapshot.queryParams['isOldPcipalOff'] === 'Enable';
      this.isNewPcipalOff = this.activatedRoute.snapshot.queryParams['isNewPcipalOff'] === 'Enable';
      this.excReference = this.activatedRoute.snapshot.queryParams['exceptionRecord'];
      this.view = this.activatedRoute.snapshot.queryParams['view'];
      this.takePayment = this.activatedRoute.snapshot.queryParams['takePayment'];
      this.paymentGroupRef = this.activatedRoute.snapshot.queryParams['paymentGroupRef'];
      this.dcnNumber = this.activatedRoute.snapshot.queryParams['dcn'];
      this.selectedOption = this.activatedRoute.snapshot.queryParams['selectedOption'];
    });
  }
}
