import { decodeSubscriptionData, validateSubscriptionData } from '@/shared/encoder';
import { renderSubscription } from '@/server/subscription';
import type { SubscriptionData } from '@/shared/types';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const data = url.searchParams.get('data');

  if (!data) {
    return Response.json({ error: 'Missing data parameter' }, { status: 400 });
  }

  if (data.length > 65536) {
    return Response.json({ error: 'Data too large' }, { status: 400 });
  }

  let subscriptionData: SubscriptionData;
  try {
    subscriptionData = decodeSubscriptionData(data);
  } catch {
    return Response.json({ error: 'Invalid encoded data' }, { status: 400 });
  }

  try {
    subscriptionData = validateSubscriptionData(subscriptionData);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Invalid subscription data structure' },
      { status: 400 },
    );
  }

  return renderSubscription(context.request, subscriptionData);
};
