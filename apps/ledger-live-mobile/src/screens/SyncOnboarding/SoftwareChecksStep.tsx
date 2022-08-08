import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import {
  CircledAlertMedium,
  CircledCheckSolidMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useGenuineCheck } from "@ledgerhq/live-common/lib/hw/hooks/useGenuineCheck";
import { useGetLatestFirmware } from "@ledgerhq/live-common/lib/hw/hooks/useGetLatestFirmware";
import { getDeviceModel } from "@ledgerhq/devices/lib/index";
import { useTheme } from "styled-components/native";

import GenuineCheckDrawer from "./GenuineCheckDrawer";
import FirmwareUpdateDrawer from "./FirmwareUpdateDrawer";
import GenuineCheckCancelledDrawer from "./GenuineCheckCancelledDrawer";
import UnlockDeviceDrawer from "./UnlockDeviceDrawer";
import AllowManagerDrawer from "./AllowManagerDrawer";

const softwareStepDelay = 2500;
const lockedDeviceTimeoutMs = 1000;

type CheckStatus = "inactive" | "active" | "completed" | "failed";

type GenuineCheckUiStepStatus = CheckStatus;
type GenuineCheckStatus =
  | "unchecked"
  | "requested"
  | "ongoing"
  | "completed"
  | "failed";
type GenuineCheckUiDrawerStatus =
  | "none"
  | "requested"
  | "allow-manager"
  | "unlock-needed"
  | "cancelled";

type FirmwareUpdateUiStepStatus = CheckStatus;
type FirmwareUpdateStatus =
  | "unchecked"
  | "ongoing"
  | "new-firmware-available"
  | "completed"
  | "failed";
type FirmwareUpdateUiDrawerStatus = "none" | "new-firmware-available";

type CheckCardProps = FlexBoxProps & {
  title: string;
  index: number;
  status: CheckStatus;
};

const CheckCard = ({ title, index, status, ...props }: CheckCardProps) => {
  const { colors } = useTheme();

  const getCheckIcon = useCallback(
    (status: CheckStatus, index: number) => {
      if (status === "active") {
        return <InfiniteLoader color={colors.primary.c80} size={24} />;
      }
      if (status === "completed") {
        return <CircledCheckSolidMedium color="success.c100" size={24} />;
      }
      if (status === "failed") {
        return <CircledAlertMedium color="warning.c100" size={24} />;
      }
      return <Text variant="body">{index}</Text>;
    },
    [colors.primary.c80],
  );

  return (
    <Flex flexDirection="row" alignItems="center" {...props}>
      <BoxedIcon
        backgroundColor="neutral.c30"
        borderColor="neutral.c30"
        variant="circle"
        Icon={getCheckIcon(status, index)}
      />
      <Text ml={4} variant="body">
        {title}
      </Text>
    </Flex>
  );
};

export type Props = {
  device: Device;
  isDisplayed?: boolean;
  onComplete?: () => void;
};

const SoftwareChecksStep = ({ device, isDisplayed, onComplete }: Props) => {
  const { t } = useTranslation();

  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;

  const [currentDisplayedDrawer, setCurrentDisplayedDrawer] = useState<
    GenuineCheckUiDrawerStatus | FirmwareUpdateUiDrawerStatus
  >("none");

  // Will be computed depending on the states. Updating nextDrawerToDisplay
  // triggers the current displayed drawer to close
  let nextDrawerToDisplay:
    | GenuineCheckUiDrawerStatus
    | FirmwareUpdateUiDrawerStatus = "none";

  // TODO export type
  const [currentSoftwareCheck, setCurrentSoftwareCheck] = useState<
    "none" | "genuineCheck" | "firmwareUpdate" | "complete"
  >("none");

  const [genuineCheckStatus, setGenuineCheckStatus] = useState<
    GenuineCheckStatus
  >("unchecked");

  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<
    FirmwareUpdateStatus
  >("unchecked");

  // Not a DeviceAction as we're only interested in the permission requested, granted and result.
  // No need the full DeviceAction with its retry strategy etc.
  const {
    genuineState,
    devicePermissionState,
    error: genuineCheckError,
    resetGenuineCheckState,
  } = useGenuineCheck({
    isHookEnabled: genuineCheckStatus === "ongoing",
    deviceId: device.deviceId,
    lockedDeviceTimeoutMs,
  });

  // Genuine check entry points
  useEffect(() => {
    // First time doing the genuine check
    if (isDisplayed && currentSoftwareCheck === "none") {
      setCurrentSoftwareCheck("genuineCheck");
      setGenuineCheckStatus("requested");
    }
    // Retry entry point
    else if (
      isDisplayed &&
      currentSoftwareCheck === "genuineCheck" &&
      genuineCheckStatus === "unchecked"
    ) {
      setGenuineCheckStatus("ongoing");
    }
  }, [isDisplayed, currentSoftwareCheck, genuineCheckStatus]);

  // Handles the completion of the entire software check step
  useEffect(() => {
    if (isDisplayed && onComplete && currentSoftwareCheck === "complete") {
      // FIXME: timeout for now to display the status of the available fw update
      setTimeout(() => onComplete(), 2000);
    }
  }, [currentSoftwareCheck, isDisplayed, onComplete]);

  let genuineCheckUiStepStatus: GenuineCheckUiStepStatus = "inactive";
  let firmwareUpdateUiStepStatus: FirmwareUpdateUiStepStatus = "inactive";

  // Handle genuine check UI logic
  if (isDisplayed) {
    if (currentSoftwareCheck === "genuineCheck") {
      if (genuineCheckStatus === "requested") {
        genuineCheckUiStepStatus = "active";
        nextDrawerToDisplay = "requested";
      } else if (genuineCheckStatus === "ongoing") {
        genuineCheckUiStepStatus = "active";
        nextDrawerToDisplay = "none";

        // Updates the genuineCheckStatus
        if (genuineCheckError) {
          console.error(
            "Failed to perform genuine check with error:",
            genuineCheckError.message,
          );
          setGenuineCheckStatus("failed");
        } else if (genuineState === "genuine") {
          setGenuineCheckStatus("completed");
        } else if (genuineState === "non-genuine") {
          // FIXME: if the device is non-genuine, we should display something else
          setGenuineCheckStatus("failed");
        }

        // Updates the UI
        if (devicePermissionState === "unlock-needed") {
          nextDrawerToDisplay = "unlock-needed";
        } else if (devicePermissionState === "requested") {
          nextDrawerToDisplay = "allow-manager";
        } else if (devicePermissionState === "refused") {
          nextDrawerToDisplay = "cancelled";
        }
      }
    }
    // currentSoftwareCheck be any value for this UI update
    if (genuineCheckStatus === "completed") {
      genuineCheckUiStepStatus = "completed";
    } else if (genuineCheckStatus === "failed") {
      genuineCheckUiStepStatus = "failed";
    }
  }

  const {
    latestFirmware,
    error: latestFirmwareGettingError,
    status: latestFirmwareGettingStatus,
  } = useGetLatestFirmware({
    isHookEnabled: firmwareUpdateStatus === "ongoing",
    deviceId: device.deviceId,
  });

  // Handles the firmware update logic
  useEffect(() => {
    // The software check step is not the current step
    if (!isDisplayed) return;

    // Transitions from genuine check step to firmware update step
    if (
      ["completed", "failed"].includes(genuineCheckStatus) &&
      firmwareUpdateStatus === "unchecked"
    ) {
      setTimeout(() => {
        setFirmwareUpdateStatus("ongoing");
      }, softwareStepDelay);
    }

    if (latestFirmwareGettingError) {
      console.error(
        "Failed to retrieve latest firmware version with error:",
        latestFirmwareGettingError.message,
      );
      setFirmwareUpdateStatus("failed");
    }

    if (
      latestFirmwareGettingStatus === "available-firmware" &&
      latestFirmware &&
      firmwareUpdateStatus === "ongoing"
    ) {
      setFirmwareUpdateStatus("new-firmware-available");
    }

    if (latestFirmwareGettingStatus === "no-available-firmware") {
      setFirmwareUpdateStatus("completed");
    }
  }, [
    firmwareUpdateStatus,
    genuineCheckStatus,
    isDisplayed,
    latestFirmware,
    latestFirmwareGettingError,
    latestFirmwareGettingStatus,
  ]);

  // The software check step is not the current step
  if (!isDisplayed) {
    genuineCheckUiStepStatus = "inactive";
    firmwareUpdateUiStepStatus = "inactive";
    nextDrawerToDisplay = "none";
  } else if (["completed", "failed"].includes(genuineCheckStatus)) {
    // Handles the firmware update UI
    switch (firmwareUpdateStatus) {
      case "ongoing":
        firmwareUpdateUiStepStatus = "active";
        nextDrawerToDisplay = "none";
        break;
      case "new-firmware-available":
        firmwareUpdateUiStepStatus = "active";
        nextDrawerToDisplay = "new-firmware-available";
        break;
      case "completed":
        firmwareUpdateUiStepStatus = "completed";
        nextDrawerToDisplay = "none";
        break;
      case "failed":
        firmwareUpdateUiStepStatus = "failed";
        nextDrawerToDisplay = "none";
        break;
      case "unchecked":
      default:
        firmwareUpdateUiStepStatus = "inactive";
        nextDrawerToDisplay = "none";
    }
  }

  console.log(
    `🧙‍♂️ genuineCheckStatus = ${genuineCheckStatus} | genuineCheckUiStepStatus = ${genuineCheckUiStepStatus} | currentDisplayedDrawer = ${currentDisplayedDrawer} | nextDrawerToDisplay = ${nextDrawerToDisplay}`,
  );

  // Handles the genuine check UI step title
  let genuineCheckStepTitle;
  switch (genuineCheckUiStepStatus) {
    case "active":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.active.title",
        {
          productName,
        },
      );
      break;
    case "completed":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.completed.title",
        {
          productName,
        },
      );
      break;
    case "failed":
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.failed.title",
      );
      break;
    default:
      genuineCheckStepTitle = t(
        "syncOnboarding.softwareChecksSteps.genuineCheckStep.inactive.title",
      );
      break;
  }

  // Handles the firmware update UI step title
  let firmwareUpdateStepTitle;
  switch (firmwareUpdateUiStepStatus) {
    case "active":
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.active.title",
      );
      break;
    case "completed":
      if (
        latestFirmwareGettingStatus === "available-firmware" &&
        latestFirmware
      ) {
        firmwareUpdateStepTitle = t(
          "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.completed.updateAvailable.title",
          {
            firmwareVersion: JSON.stringify(latestFirmware.final.name),
          },
        );
      } else {
        firmwareUpdateStepTitle = t(
          "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.completed.noUpdateAvailable.title",
        );
      }
      break;
    case "failed":
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.failed.title",
      );
      break;
    default:
      firmwareUpdateStepTitle = t(
        "syncOnboarding.softwareChecksSteps.firmwareUpdateStep.inactive.title",
      );
      break;
  }

  // If there is already a displayed drawer, the currentDisplayedDrawer would be
  // synchronized with nextDrawerToDisplay during the displayed drawer onClose event
  if (currentDisplayedDrawer === "none" && nextDrawerToDisplay !== "none") {
    setCurrentDisplayedDrawer(nextDrawerToDisplay);
  }

  return (
    <Flex>
      {isDisplayed && (
        <Flex>
          <GenuineCheckDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "requested" &&
              nextDrawerToDisplay === "requested"
            }
            onPress={() => setGenuineCheckStatus("ongoing")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
          <UnlockDeviceDrawer
            isOpen={
              currentDisplayedDrawer === "unlock-needed" &&
              nextDrawerToDisplay === "unlock-needed"
            }
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
            device={device}
          />
          <AllowManagerDrawer
            isOpen={
              currentDisplayedDrawer === "allow-manager" &&
              nextDrawerToDisplay === "allow-manager"
            }
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
            device={device}
          />
          <GenuineCheckCancelledDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "cancelled" &&
              nextDrawerToDisplay === "cancelled"
            }
            onRetry={() => {
              resetGenuineCheckState();
              setGenuineCheckStatus("unchecked");
            }}
            onSkip={() => setGenuineCheckStatus("failed")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
          <FirmwareUpdateDrawer
            productName={productName}
            isOpen={
              currentDisplayedDrawer === "new-firmware-available" &&
              nextDrawerToDisplay === "new-firmware-available"
            }
            onSkip={() => setFirmwareUpdateStatus("completed")}
            onUpdate={() => setFirmwareUpdateStatus("completed")}
            onClose={() => setCurrentDisplayedDrawer(nextDrawerToDisplay)}
          />
        </Flex>
      )}
      <CheckCard
        title={genuineCheckStepTitle}
        status={genuineCheckUiStepStatus}
        index={1}
        mb={4}
      />
      <CheckCard
        title={firmwareUpdateStepTitle}
        status={firmwareUpdateUiStepStatus}
        index={2}
      />
    </Flex>
  );
};

export default SoftwareChecksStep;
