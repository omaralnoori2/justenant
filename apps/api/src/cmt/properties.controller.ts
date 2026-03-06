import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PropertiesService, CreatePropertyDto, BulkGenerateUnitsDto } from './properties.service';

@Controller('cmt/properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  // Get all properties for the CMT
  @Get()
  async getProperties(@Request() req) {
    return this.propertiesService.getProperties(req.user.cmtId);
  }

  // Create a new property
  @Post()
  async createProperty(@Request() req, @Body() data: CreatePropertyDto) {
    return this.propertiesService.createProperty(req.user.cmtId, data);
  }

  // Get a specific property
  @Get(':id')
  async getProperty(@Request() req, @Param('id') id: string) {
    return this.propertiesService.getProperty(id, req.user.cmtId);
  }

  // Update property details
  @Patch(':id')
  async updateProperty(@Request() req, @Param('id') id: string, @Body() data: Partial<CreatePropertyDto>) {
    return this.propertiesService.updateProperty(id, req.user.cmtId, data);
  }

  // Delete property
  @Delete(':id')
  async deleteProperty(@Request() req, @Param('id') id: string) {
    return this.propertiesService.deleteProperty(id, req.user.cmtId);
  }

  // Bulk generate units with X*Y*Z naming
  @Post(':id/generate-units')
  async generateUnits(
    @Request() req,
    @Param('id') propertyId: string,
    @Body() config: BulkGenerateUnitsDto,
  ) {
    return this.propertiesService.generateUnitsForProperty(propertyId, req.user.cmtId, config);
  }

  // Get all units in a property
  @Get(':id/units')
  async getUnits(@Request() req, @Param('id') propertyId: string) {
    return this.propertiesService.getUnits(propertyId, req.user.cmtId);
  }

  // Update unit name
  @Patch(':propertyId/units/:unitId')
  async updateUnitName(
    @Request() req,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
    @Body('name') name: string,
  ) {
    return this.propertiesService.updateUnitName(propertyId, unitId, req.user.cmtId, name);
  }
}
