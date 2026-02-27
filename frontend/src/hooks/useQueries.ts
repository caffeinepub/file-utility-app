import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { UTRVerificationStatus, type UTRSubmission, type DailyUsageResponse, type UserProfile } from '../backend';

export function useGetMyVerificationStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UTRVerificationStatus>({
    queryKey: ['myVerificationStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMyVerificationStatus();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSubmitUTR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, utrId }: { email: string; utrId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitUTR(email, utrId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVerificationStatus'] });
    },
  });
}

export function useGetPendingVerifications() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UTRSubmission[]>({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPendingVerifications();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useApproveUTR() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: import('@icp-sdk/core/principal').Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveUTR(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
    },
  });
}

export function useGetIsPro() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<boolean>({
    queryKey: ['isPro'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getIsPro();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}

export function useGetDailyUsage() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<[UserProfile, DailyUsageResponse] | null>({
    queryKey: ['dailyUsage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDailyUsage();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });
}
