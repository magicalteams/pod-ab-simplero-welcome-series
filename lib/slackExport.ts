import { WebClient } from '@slack/web-api';

export interface ExportPostParams {
  csv: string;
  filename: string;
  rowCount: number;
  rangeStart: string;
  rangeEnd: string;
}

export interface EmptyRunParams {
  rangeStart: string;
  rangeEnd: string;
}

function getClient(): WebClient {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error('Missing SLACK_BOT_TOKEN');
  return new WebClient(token);
}

function getChannel(): string {
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!channel) throw new Error('Missing SLACK_CHANNEL_ID');
  return channel;
}

function importInstructions(rowCount: number, rangeStart: string, rangeEnd: string): string {
  return [
    `*Monthly Substack Import — Character*`,
    ``,
    `${rowCount} new subscriber${rowCount === 1 ? '' : 's'} completed Anne's welcome series between ${rangeStart} and ${rangeEnd}.`,
    ``,
    `*To import:*`,
    `1. Download the attached CSV.`,
    `2. Go to https://annebenven.substack.com/publish/subscribers → click *Import*.`,
    `3. Choose *Upload a CSV file* → select the downloaded file.`,
    `4. Set subscriber type to *Free*.`,
    `5. Confirm and click *Import*.`,
    ``,
    `Drop a :white_check_mark: in thread once done. Questions → ping the tech pod.`,
  ].join('\n');
}

export async function postExportToSlack(params: ExportPostParams): Promise<void> {
  const client = getClient();
  const channel = getChannel();

  const result = await client.files.uploadV2({
    channel_id: channel,
    filename: params.filename,
    file: Buffer.from(params.csv, 'utf8'),
    initial_comment: importInstructions(params.rowCount, params.rangeStart, params.rangeEnd),
  });

  if (!result.ok) {
    throw new Error(`Slack files.uploadV2 failed: ${JSON.stringify(result)}`);
  }
}

export async function postEmptyRunToSlack(params: EmptyRunParams): Promise<void> {
  const client = getClient();
  const channel = getChannel();

  const text = `*Monthly Substack Import — Character*\n\nNo new Character subscribers completed the welcome series between ${params.rangeStart} and ${params.rangeEnd}. Nothing to import this month.`;

  const result = await client.chat.postMessage({ channel, text });

  if (!result.ok) {
    throw new Error(`Slack chat.postMessage failed: ${JSON.stringify(result)}`);
  }
}
