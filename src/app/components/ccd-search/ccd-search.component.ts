import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CaseRefService } from '../../services/caseref/caseref.service';
import { PaymentGroupService } from '../../services/payment-group/payment-group.service';
import { ViewPaymentService } from 'projects/view-payment/src/lib/view-payment.service';

@Component({
  selector: 'app-ccd-search',
  templateUrl: './ccd-search.component.html',
  styleUrls: ['./ccd-search.component.scss']
})
export class CcdSearchComponent implements OnInit {
  searchForm: FormGroup;
  hasErrors = false;
  ccdCaseNumber: string;
  excReference: string;
  dcnNumber: string;
  takePayment: boolean;
  selectedValue = 'CCDorException';
  ccdPattern =  /^([0-9]{4}\-[0-9]{4}\-[0-9]{4}\-[0-9]{4})?([0-9]{16})?$/i;
  dcnPattern = /^[0-9]{21}$/i;
  prnPattern = /^([a-z]{2}\-[0-9]{4}\-[0-9]{4}\-[0-9]{4}\-[0-9]{4})?([a-z]{2}\[0-9]{16})?$/i;
  noCaseFound = false;
  noCaseFoundInCCD = false;
  isBulkscanningEnable = true;
  isStrategicFixEnable: boolean;
  isTurnOff: boolean;
  isOldPcipalOff: boolean;
  isNewPcipalOff: boolean;

  constructor(
    private paymentGroupService: PaymentGroupService,
    private formBuilder: FormBuilder,
    private router: Router,
    private caseRefService: CaseRefService,
    private activatedRoute: ActivatedRoute,
    private viewPaymentService: ViewPaymentService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(() => {
      this.takePayment = this.activatedRoute.snapshot.queryParams['takePayment'] === 'false' ? null : true ;
    });
    this.paymentGroupService.getBSFeature().then((status) => {
      this.isBulkscanningEnable = status;
    });
    this.paymentGroupService.getLDFeature('bspayments-strategic').then((status) => {
      this.isStrategicFixEnable = status;
    });
    this.paymentGroupService.getLDFeature('apportion-feature').then((status) => {
      this.isTurnOff = status;
    });
    this.paymentGroupService.getLDFeature('FE-pcipal-old-feature').then((status) => {
      this.isOldPcipalOff = status;
    });
    this.paymentGroupService.getLDFeature('FE-pcipal-antenna-feature').then((status) => {
      this.isNewPcipalOff = status;
    });
    this.fromValidation();
   }

   fromValidation() {
    this.searchForm = this.formBuilder.group({
    searchInput: new FormControl('',
     [ Validators.required,
      Validators.pattern(!this.isBulkscanningEnable ?
        // tslint:disable-next-line:max-line-length
        this.ccdPattern : this.selectedValue === 'CCDorException' ? this.ccdPattern : this.selectedValue === 'DCN' ? this.dcnPattern : this.prnPattern)
    ]),
    CCDorException: new FormControl(this.selectedValue) });
}

  onSelectionChange(value: string) {
      this.selectedValue = value;
      this.hasErrors = false;
      this.noCaseFoundInCCD = false;
      this.noCaseFound = false;
      this.searchForm.get('CCDorException').setValue(value);
      this.fromValidation();
    }

  searchFees() {
      if (this.searchForm.controls['searchInput'].valid) {
      this.hasErrors = false;
      const searchValue = this.searchForm.get('searchInput').value;
      let partUrl = this.isBulkscanningEnable ? '&isBulkScanning=Enable' : '&isBulkScanning=Disable';
        partUrl += this.isStrategicFixEnable ? '&isStFixEnable=Enable' : '&isStFixEnable=Disable';
        partUrl += this.isTurnOff ? '&isTurnOff=Enable' : '&isTurnOff=Disable';
        partUrl += this.isOldPcipalOff ? '&isOldPcipalOff=Enable' : '&isOldPcipalOff=Disable';
        partUrl += this.isNewPcipalOff ? '&isNewPcipalOff=Enable' : '&isNewPcipalOff=Disable';

      if (this.selectedValue.toLocaleLowerCase() === 'dcn') {
        this.paymentGroupService.getBSPaymentsByDCN(searchValue).then((res) => {
          if (res['data'].ccd_reference || res['data'].exception_record_reference) {
            this.dcnNumber = searchValue;
            if (res['data'].ccd_reference !== undefined) {
              this.ccdCaseNumber = res['data'].ccd_reference ;
              this.excReference = '';
            } else if (res['data'].exception_record_reference !== undefined ) {
              this.excReference = res['data'].exception_record_reference ;
              this.ccdCaseNumber = '';
            }
            // tslint:disable-next-line:max-line-length
            let url = this.takePayment ? `?selectedOption=${this.selectedValue}&exceptionRecord=${this.excReference}&dcn=${this.dcnNumber}&view=case-transactions&takePayment=${this.takePayment}` : `?selectedOption=${this.selectedValue}&exceptionRecord=${this.excReference}&dcn=${this.dcnNumber}&view=case-transactions`;
             url = url.replace(/[\r\n]+/g, ' ');
            // tslint:disable-next-line:max-line-length
            this.router.navigateByUrl(`/payment-history/${this.ccdCaseNumber}${url}${partUrl}`);
          }
          this.noCaseFound = true;
        }).catch(() => {
          this.noCaseFound = true;
        });

      } else if (this.selectedValue.toLocaleLowerCase() === 'ccdorexception') {
        this.ccdCaseNumber = this.removeHyphenFromString(searchValue);
        this.dcnNumber = null;
        this.caseRefService.validateCaseRef(this.ccdCaseNumber).subscribe(resp => {
          this.noCaseFoundInCCD = false;
          // tslint:disable-next-line:max-line-length
          let url = this.takePayment ? `?selectedOption=${this.selectedValue}&dcn=${this.dcnNumber}&view=case-transactions&takePayment=${this.takePayment}` : `?selectedOption=${this.selectedValue}&dcn=${this.dcnNumber}&view=case-transactions`;
           url = url.replace(/[\r\n]+/g, ' ');
          // tslint:disable-next-line:max-line-length
          this.router.navigateByUrl(`/payment-history/${this.ccdCaseNumber}${url}${partUrl}`);
        }, err => {
         this.noCaseFoundInCCD = true;
        });
      } else if (this.selectedValue.toLocaleLowerCase() === 'rc') {
        this.noCaseFound = false;
        this.viewPaymentService.getPaymentDetail(searchValue).subscribe((res) => {
          if (res['ccd_case_number'] || res['case_reference']) {
            this.ccdCaseNumber = res['ccd_case_number'] ? res['ccd_case_number'] : res['case_reference'];
            this.dcnNumber = null;
            this.caseRefService.validateCaseRef(this.ccdCaseNumber).subscribe(resp => {
              this.noCaseFound = false;
              // tslint:disable-next-line:max-line-length
              const url = this.takePayment ? `?selectedOption=${this.selectedValue}&dcn=${this.dcnNumber}&view=case-transactions&takePayment=${this.takePayment}` : `?selectedOption=${this.selectedValue}&dcn=${this.dcnNumber}&view=case-transactions`;
              this.router.navigateByUrl(`/payment-history/${this.ccdCaseNumber}${url}${partUrl}`);
              }, err => {
              this.noCaseFound = true;
            });
          }
          }, err => {
            this.noCaseFoundInCCD = true;
          });
      } else  {
      return this.hasErrors = true;
    }
  } else {
    return this.hasErrors = true;
  }
}

  removeHyphenFromString(input: string) {
    const pattern = /\-/gi;
    return input.replace(pattern, '');
  }
}
