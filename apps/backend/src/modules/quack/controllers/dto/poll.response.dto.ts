import { Poll } from '@/modules/quack/domain/poll';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PollOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ description: 'Number of votes for this option' })
  votes!: number;
}

export class PollResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [PollOptionDto] })
  options!: PollOptionDto[];

  @ApiProperty()
  totalVotes!: number;

  @ApiPropertyOptional({
    description: 'The option the signed-in user voted for',
  })
  myVoteOptionId?: string;

  static fromDomain(poll: Poll): PollResponseDto {
    return {
      id: poll.id,
      options: poll.options.map(({ id, text, votes }) => ({ id, text, votes })),
      totalVotes: poll.totalVotes,
      myVoteOptionId: poll.myVoteOptionId,
    };
  }
}
