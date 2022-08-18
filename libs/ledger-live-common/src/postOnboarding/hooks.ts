import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/devices/index";
import {
  PostOnboardingActionId,
  PostOnboardingHubState,
} from "@ledgerhq/types-live";
import { useFeatureFlags } from "../featureFlags";
import {
  hubStateSelector,
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "./reducer";
import {
  clearPostOnboardingLastActionCompleted,
  hidePostOnboardingWalletEntryPoint,
  initPostOnboarding,
  setPostOnboardingActionCompleted,
} from "./actions";
import { usePostOnboardingContext } from "./PostOnboardingProvider";

/**
 * @returns an object representing the state that should be rendered on the post
 * onboarding hub screen.
 *
 * This takes feature flagging into account so the logic is
 * resistant to flags getting enabled/disabled over time (for a given disabled
 * feature flag, the actions pointing to it will be excluded).
 * TODO: unit test this
 * */
export function usePostOnboardingHubState(): PostOnboardingHubState {
  const hubState = useSelector(hubStateSelector);
  const { getPostOnboardingAction } = usePostOnboardingContext();
  const { getFeature } = useFeatureFlags();
  return useMemo(() => {
    const actionsState = hubState.actionsToComplete
      .map((actionId) => ({
        ...getPostOnboardingAction(actionId),
        completed: !!hubState.actionsCompleted[actionId],
      }))
      .filter(
        (actionWithState) =>
          !actionWithState.featureFlagId ||
          getFeature(actionWithState.featureFlagId)?.enabled
      );
    const lastActionCompleted = hubState.lastActionCompleted
      ? getPostOnboardingAction(hubState.lastActionCompleted)
      : null;
    return {
      deviceModelId: hubState.deviceModelId,
      lastActionCompleted,
      actionsState,
    };
  }, [getFeature, hubState, getPostOnboardingAction]);
}

/**
 *
 * @returns a boolean representing whether all the post onboarding actions have
 * been completed.
 * TODO: unit test this
 */
export function useAllPostOnboardingActionsCompleted(): boolean {
  const { actionsState } = usePostOnboardingHubState();
  return actionsState.every((action) => action.completed);
}

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 * TODO: unit test this
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  const dismissed = useSelector(
    walletPostOnboardingEntryPointDismissedSelector
  );
  const allCompleted = useAllPostOnboardingActionsCompleted();
  return !(dismissed || allCompleted);
}

/**
 *
 * @returns the DeviceModelId of the device of the post onboarding.
 */
export function usePostOnboardingDeviceModelId(): DeviceModelId {
  return useSelector(postOnboardingDeviceModelIdSelector);
}

/**
 * Use this to initialize AND navigate to the post onboarding hub for a given
 * device model.
 *
 * @param deviceModelId
 * @returns a function that can be called to initialize the post
 * onboarding for the given device model and navigate to the post onboarding
 * hub.
 * TODO: unit test this
 */
export function useStartPostOnboardingCallback(
  deviceModelId: DeviceModelId,
  mock = false
): () => void {
  const dispatch = useDispatch();
  const { getPostOnboardingActionsForDevice, navigateToPostOnboardingHub } =
    usePostOnboardingContext();
  const actions = useMemo(
    () => getPostOnboardingActionsForDevice(deviceModelId, mock),
    [deviceModelId, mock, getPostOnboardingActionsForDevice]
  );
  return useCallback(() => {
    dispatch(
      initPostOnboarding({
        deviceModelId,
        actionsIds: actions.map((action) => action.id),
      })
    );
    if (actions.length === 0) return;
    navigateToPostOnboardingHub();
  }, [actions, deviceModelId, dispatch, navigateToPostOnboardingHub]);
}

/**
 * @returns a function to hide the post onboarding entry point on the wallet
 * screen.
 */
export function useHideWalletEntryPointCallback(): () => void {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);
}

/**
 * @returns a function to signal the completion of an action of the post
 * onboarding.
 */
export function useSetActionCompletedCallback(): (
  actionId: PostOnboardingActionId
) => void {
  const dispatch = useDispatch();
  return useCallback(
    (actionId: PostOnboardingActionId) =>
      dispatch(setPostOnboardingActionCompleted({ actionId })),
    [dispatch]
  );
}

export function useClearLastActionCompletedCallback(): () => void {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
}
