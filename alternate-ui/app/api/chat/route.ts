import { anthropic } from "@ai-sdk/anthropic";

import { getEdgeRuntimeResponse } from "@assistant-ui/react/edge";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const requestData = await request.json();

  return getEdgeRuntimeResponse({
    options: {
      model: anthropic("claude-3-5-sonnet-latest"),
    },
    requestData,
    abortSignal: request.signal,
  });
};
