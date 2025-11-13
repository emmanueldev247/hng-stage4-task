import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  healthCheck() {
    return {
      success: true,
      message: "User service is running and healthy",
      status: "ok",
    };
  }
}
