import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import notionService from '../services/notionService';
import { MakeWebhookPayload } from '../types';

export const handleMakeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload: MakeWebhookPayload = req.body;

  console.log('Received Make.com webhook:', payload);

  // Route webhook based on event type
  switch (payload.event) {
    case 'filing.created':
      await handleFilingCreated(payload.data);
      break;
    case 'filing.updated':
      await handleFilingUpdated(payload.data);
      break;
    case 'activity.log':
      await handleActivityLog(payload.data);
      break;
    default:
      console.log('Unknown webhook event:', payload.event);
  }

  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
  });
});

async function handleFilingCreated(data: any) {
  console.log('Processing filing creation:', data);

  // Log to Notion
  await notionService.logActivity({
    title: `Filing Created: ${data.type}`,
    status: 'Completed',
    type: 'Filing',
    description: `New ${data.type} filing created`,
    metadata: data,
  });

  // Create filing entry in Notion
  if (data.title && data.type) {
    await notionService.createFiling({
      title: data.title,
      type: data.type,
      status: data.status || 'Draft',
      content: data,
    });
  }
}

async function handleFilingUpdated(data: any) {
  console.log('Processing filing update:', data);

  await notionService.logActivity({
    title: `Filing Updated: ${data.type}`,
    status: 'Completed',
    type: 'Filing',
    description: `Filing ${data.id} was updated`,
    metadata: data,
  });
}

async function handleActivityLog(data: any) {
  console.log('Processing activity log:', data);

  await notionService.logActivity({
    title: data.title || 'Activity',
    status: data.status || 'Completed',
    type: data.type || 'General',
    description: data.description || '',
    metadata: data.metadata || {},
  });
}

export const getMakeWebhookInfo = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      endpoint: '/api/webhooks/make',
      supportedEvents: [
        'filing.created',
        'filing.updated',
        'activity.log',
      ],
      format: {
        event: 'string (required)',
        data: 'object (required)',
        timestamp: 'string (optional)',
      },
    },
  });
});
