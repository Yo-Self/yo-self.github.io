"use client";

import type { ReactNode } from "react";
import MockChatBubble from "./MockChatBubble";
import MockCart from "./MockCart";
import MockCheckout from "./MockCheckout";
import MockDeliveryMap from "./MockDeliveryMap";
import MockWaiterCall from "./MockWaiterCall";
import MockQRTable from "./MockQRTable";
import MockOrderTracking from "./MockOrderTracking";
import MockPWA from "./MockPWA";
import MockKanban from "./MockKanban";
import MockPOS from "./MockPOS";
import MockWaiterTables from "./MockWaiterTables";
import MockDeliveryRoute from "./MockDeliveryRoute";
import MockIfoodImport from "./MockIfoodImport";
import MockPhysicalMenu from "./MockPhysicalMenu";
import MockReports from "./MockReports";

export const CARDAPIO_MOCKS: Record<string, ReactNode> = {
  "ai-assistant": <MockChatBubble />,
  "smart-cart": <MockCart />,
  "multichannel-checkout": <MockCheckout />,
  "delivery-freight": <MockDeliveryMap />,
  "waiter-call": <MockWaiterCall />,
  "qr-table": <MockQRTable />,
  "order-tracking": <MockOrderTracking />,
  "pwa-offline": <MockPWA />,
};

export const GESTOR_MOCKS: Record<string, ReactNode> = {
  kanban: <MockKanban />,
  pos: <MockPOS />,
  "waiter-mode": <MockWaiterTables />,
  "delivery-mgmt": <MockDeliveryRoute />,
  "ifood-import": <MockIfoodImport />,
  "physical-menu": <MockPhysicalMenu />,
  reports: <MockReports />,
};
