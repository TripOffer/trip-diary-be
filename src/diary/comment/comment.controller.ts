import { Controller } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('diary')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}
}
