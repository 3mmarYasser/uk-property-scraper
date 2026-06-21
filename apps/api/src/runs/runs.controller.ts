import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Get()
  recent(@Query('take') take?: string) {
    return this.runs.recent(take ? parseInt(take, 10) : 20);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const run = await this.runs.findOne(id);
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return run;
  }
}
