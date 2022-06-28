import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Text, Button, Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";
import IconCross from "~/renderer/icons/Cross";
import IconCheck from "~/renderer/icons/Check";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import Color from "color";

const RuleContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  align-items: center;
`;

const RuleIconContainer = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

const ruleTypes = {
  success: {
    color: "#66BE54",
    bgColor: Color("#66BE54")
      .alpha(0.1)
      .toString(),
    Icon: IconCheck,
  },
  error: {
    color: "#EA2E49",
    bgColor: Color("#EA2E49")
      .alpha(0.1)
      .toString(),
    Icon: IconCross,
  },
};

type RuleProps = {
  type: "success" | "error";
  children: any;
};

function Rule({ type, children }: RuleProps) {
  const RuleIcon = ruleTypes[type].Icon;
  return (
    <RuleContainer>
      <RuleIconContainer
        style={{
          color: ruleTypes[type].color,
          backgroundColor: ruleTypes[type].bgColor,
        }}
      >
        <RuleIcon size={12} />
      </RuleIconContainer>
      <Text
        ml="16px"
        color="palette.text.shade100"
        ff="Inter|Regular"
        fontSize={13}
        style={{ flex: 1 }}
      >
        {children}
      </Text>
    </RuleContainer>
  );
}

const PinHelpContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export function PinHelp(props: { handleNextInDrawer: () => void }) {
  const { t } = useTranslation();

  return (
    <ScrollArea>
      <PinHelpContainer>
        <Text color="palette.text.shade100" variant="h3">
          {t("onboarding.drawers.pinHelp.title")}
        </Text>
        <Text mt="8px" mb="32px" color="palette.text.shade100" ff="Inter|Regular" fontSize={14}>
          {t("onboarding.drawers.pinHelp.intro")}
        </Text>
        <Rule type="success">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.1">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Rule type="success">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.2">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Rule type="success">{t("onboarding.drawers.pinHelp.rules.3")}</Rule>
        <Rule type="success">{t("onboarding.drawers.pinHelp.rules.4")}</Rule>
        <Rule type="error">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.5">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Rule type="error">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.6">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Rule type="error">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.7">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Rule type="error">
          <Trans i18nKey="onboarding.drawers.pinHelp.rules.8">
            <Text ff="Inter|Bold" />
          </Trans>
        </Rule>
        <Button
          variant="main"
          onClick={props.handleNextInDrawer}
          Icon={() => <Icons.ArrowRightMedium size={18} />}
        >
          {t("v3.onboarding.screens.welcome.nextButton")}
        </Button>
      </PinHelpContainer>
    </ScrollArea>
  );
}
