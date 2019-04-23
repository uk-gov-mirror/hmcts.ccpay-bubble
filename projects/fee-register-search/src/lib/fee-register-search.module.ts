import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { FeeRegisterSearchComponent } from './fee-register-search.component';
import { FeeRegisterSearchService } from './fee-register-search.service';
import { FeeListComponent } from './components/fee-list/fee-list.component';
import { FeeSearchComponent } from './components/fee-search/fee-search.component';
import { FilterFeesPipe } from './pipes/filter-fees.pipe';

@NgModule({
  declarations: [
    FeeRegisterSearchComponent,
    FeeListComponent,
    FeeSearchComponent,
    FilterFeesPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule
  ],
  providers: [FeeRegisterSearchService],
  exports: [FeeRegisterSearchComponent]
})
export class FeeRegisterSearchModule { }
