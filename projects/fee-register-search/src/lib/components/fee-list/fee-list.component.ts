import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IFee } from '../../interfaces';
import { Jurisdictions } from '../../models/Jurisdictions';

@Component({
  selector: 'pay-fee-list',
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss']
})
export class FeeListComponent {
  @Input() fees?: IFee[];
  @Input() searchFilter?: string;
  @Input() jurisdictionsFilter?: Jurisdictions;
  @Input() isSelectLinkDisable;
  @Output() selectedFeeEvent: EventEmitter<IFee> = new EventEmitter();
  p = 1;

  selectFee(fee: IFee) {
    this.isSelectLinkDisable = true;
    this.selectedFeeEvent.emit(fee);
  }
}
