import { Component, inject, type OnInit } from '@angular/core'
import { ConfigService } from '../../services/config.service'
import type { ConfigResponse } from '@shared/api-response/ConfigResponse'
import { MaterialModule } from '../../material-module'

@Component({
  selector: 'app-approval-required',
  imports: [MaterialModule],
  templateUrl: './approval-required.component.html',
  styleUrl: './approval-required.component.scss',
})

export class ApprovalRequiredComponent implements OnInit {
  config?: ConfigResponse

  configService = inject(ConfigService)

  async ngOnInit() {
    this.config = await this.configService.getConfig()
  }
}
