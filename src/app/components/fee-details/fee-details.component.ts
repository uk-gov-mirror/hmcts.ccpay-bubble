import { PaymentGroupService } from './../../services/payment-group/payment-group.service';
import { IVersion } from './../../../../projects/fee-register-search/src/lib/interfaces/IVersion';
import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { IFee } from '../../../../projects/fee-register-search/src/lib/interfaces';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';



@Component({
  selector: 'app-fee-details',
  templateUrl: './fee-details.component.html',
  styleUrls: ['./fee-details.component.scss']
})
export class FeeDetailsComponent implements OnInit, OnChanges {
  selectedFeeVersion: IVersion;
  validOldVersionArray: IVersion[] = [];
  isDiscontinuedFeatureEnabled = true;
  @Input() fee = {
    code: 'test-code',
    fee_type: 'banded',
    fee_versions: [
      {
        description: 'Recovery order (section 50)',
        status: 'approved',
        author: '126172',
        approvedBy: '126175',
        version: 1,
        valid_from: '2014-04-21T00:00:00.000+0000',
        valid_to: '2014-04-21T00:00:00.000+0000',
        flat_amount: {
          'amount': 215
        },
        memo_line: 'RECEIPT OF FEES - Family misc private',
        statutory_instrument: '2014 No 877 ',
        si_ref_id: '2.1q',
        natural_account_code: '4481102174',
        fee_order_name: 'Family Proceedings',
        direction: 'cost recovery'
      }
    ],
    'current_version': {
      version: 1,
      calculatedAmount: 1234,
      memo_line: 'test-memoline',
      natural_account_code: '1234-1234-1234-1234',
      flat_amount: {
        amount: 1234
      },
      description: 'test-description'
    }

  };
  @Output() submitFeeVolumeEvent: EventEmitter<{ volumeAmount: number, selectedVersionEmit: IVersion }> = new EventEmitter();
  @Output() restartSearchEvent: EventEmitter<IFee> = new EventEmitter();

  feeDetailFormGroup: FormGroup;

  feeVolumeControl: FormControl;
  feeAmountFormControl: FormControl;
  calculatedAmountFormControl: FormControl;

  constructor(
    private paymentGroupService: PaymentGroupService,
    private formBuilder: FormBuilder
  ) {
  }

  async ngOnChanges() {
    this.isDiscontinuedFeatureEnabled = await this.paymentGroupService.getDiscontinuedFrFeature();
    if (this.isDiscontinuedFeatureEnabled) {
      this.validOldVersionArray = this.validOldFeesVersions(this.fee);
    }
  }
  ngOnInit() {
    this.feeDetailFormGroup = this.formBuilder.group({
      feeOrVolumeControl: new FormControl({ value: 1, disabled: false }),
      feeAmountFormControl: new FormControl({ value: '0', disabled: false })
    });
  }

  goBack() {
    this.restartSearchEvent.emit();
  }

  submitVolume() {
    if (this.fee.current_version.flat_amount !== undefined && this.fee.fee_type === 'banded') {
      this.fee.current_version.flat_amount.amount = this.feeDetailFormGroup.get('feeAmountFormControl').value;

      if (this.selectedFeeVersion != null) {
        this.selectedFeeVersion.flat_amount.amount = this.feeDetailFormGroup.get('feeAmountFormControl').value;
      }
    }

    this.submitFeeVolumeEvent.emit({
      volumeAmount: this.feeDetailFormGroup.get('feeOrVolumeControl').value, selectedVersionEmit: this.selectedFeeVersion
    });
  }

  getSelectedFeesVersion(currentSelectedFeeVersion: IVersion) {
    this.selectedFeeVersion = currentSelectedFeeVersion;
  }

  validOldFeesVersions(feesObject: any) {
    const validOldFeeVersionArray = new Array();

    if (feesObject.fee_versions.length > 1) {
      /* sort based on valid from */
      feesObject.fee_versions = feesObject.fee_versions.
        filter(feesVersion => feesVersion.status === 'approved')
        .sort((a, b) => {
          return <any>new Date(b.valid_from) - <any>new Date(a.valid_from);
        });

      feesObject.fee_versions.forEach(function (value, i) {
        if (i !== 0) {
          // if amount is diffrent then only consider it for push need to confirm that as well
          if (this.getAmountFromFeeVersion(value) === this.getAmountFromFeeVersion(feesObject.fee_versions[i - 1])) {
            return;
          }
          //  set valid to date if not present for fee version from previous version
          if (value.valid_to === null) {
            const oldFeeVersionPreviousIndex = validOldFeeVersionArray.length - 1;
            const new_valid_to = new Date(validOldFeeVersionArray[oldFeeVersionPreviousIndex].valid_from);
            new_valid_to.setDate(new_valid_to.getDate() - 1);
            value.valid_to = new_valid_to.toDateString();
          }
        }
        validOldFeeVersionArray.push(value);
      }.bind(this));
    }


  if (validOldFeeVersionArray.length > 1) {
      this.validOldVersionArray = validOldFeeVersionArray.filter(feesVersion => this.getValidFeeVersionsBasedOnDate(feesVersion));
      return this.validOldVersionArray;
    } else {
      return this.validOldVersionArray = [];
    }
  }

  getValidFeeVersionsBasedOnDate(feeVersion: IVersion) {
    const feesLimitDate = new Date();
    /* Check valid fees till 6 months  */
    feesLimitDate.setMonth(feesLimitDate.getMonth() - 6);

    const vaidFrom = feeVersion.valid_from;
    const valid_to = feeVersion.valid_to;

    if ((vaidFrom != null && <any>new Date(vaidFrom) > feesLimitDate) ||
      (valid_to != null && <any>new Date(valid_to) > feesLimitDate)) {
      return true;
    }
    return false;
  }

  getAmountFromFeeVersion(feeVersion: any) {
    if (feeVersion['volume_amount'] != null) {
      return feeVersion['volume_amount'].amount;
    } else if (feeVersion['flat_amount'] != null) {
      return feeVersion['flat_amount'].amount;
    } else if (feeVersion['percentage_amount'] != null) {
      return feeVersion['percentage_amount'].percentage;
    }
  }

}
