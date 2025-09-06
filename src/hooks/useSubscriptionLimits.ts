import { useSubscription } from './useSubscription';
import { useTrucks } from './useSupabase';

export const useSubscriptionLimits = () => {
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { trucks, loading: trucksLoading } = useTrucks();

  const isSubscribed = !!subscription && subscription.status === 'active';
  const truckLimit = subscription?.truckCount || 0;
  const currentTruckCount = trucks?.length || 0;
  const canAddTrucks = isSubscribed && currentTruckCount < truckLimit;
  const remainingTrucks = Math.max(0, truckLimit - currentTruckCount);

  return {
    isSubscribed,
    truckLimit,
    currentTruckCount,
    canAddTrucks,
    remainingTrucks,
    isLoading: subscriptionLoading || trucksLoading,
    subscription
  };
};
