import { promises as fs } from "fs";
import path from "path";

import yaml from "js-yaml";

import checkAndCopyConfig, { CONF_DIR, substituteEnvironmentVars } from "utils/config/config";

export async function widgetsFromConfig() {
  checkAndCopyConfig("widgets.yaml");

  const widgetsYaml = path.join(CONF_DIR, "widgets.yaml");
  const rawFileContents = await fs.readFile(widgetsYaml, "utf8");
  const fileContents = substituteEnvironmentVars(rawFileContents);
  const widgets = yaml.load(fileContents);

  if (!widgets) return [];

  // map easy to write YAML objects into easy to consume JS arrays
  const widgetsArray = widgets
    // Widgets explicitly disabled in the config editor are hidden from the display.
    // Filter before indexing so indices stay consistent between the public widgets
    // response and the private options lookup (both derive from this function).
    .filter((group) => {
      const config = group[Object.keys(group)[0]];
      return !(config && typeof config === "object" && config.enabled === false);
    })
    .map((group, index) => {
      const { enabled, ...rest } = group[Object.keys(group)[0]] || {};
      return {
        type: Object.keys(group)[0],
        options: {
          index,
          ...rest,
        },
      };
    });
  return widgetsArray;
}

export async function cleanWidgetGroups(widgets) {
  return widgets.map((widget, index) => {
    const sanitizedOptions = widget.options;
    const optionKeys = Object.keys(sanitizedOptions);

    // delete private options from the sanitized options
    ["username", "password", "key", "apiKey"].forEach((pO) => {
      if (optionKeys.includes(pO)) {
        delete sanitizedOptions[pO];
      }
    });

    // delete url from the sanitized options if the widget is not a search or glances widget
    if (widget.type !== "search" && widget.type !== "glances" && optionKeys.includes("url")) {
      delete sanitizedOptions.url;
    }

    return {
      type: widget.type,
      options: {
        index,
        ...sanitizedOptions,
      },
    };
  });
}

export async function getPrivateWidgetOptions(type, widgetIndex) {
  const widgets = await widgetsFromConfig();

  const privateOptions =
    widgets.map((widget) => {
      const { index, url, username, password, key, apiKey } = widget.options;

      return {
        type: widget.type,
        options: {
          index,
          url,
          username,
          password,
          key,
          apiKey,
        },
      };
    }) || {};

  return type !== undefined && widgetIndex !== undefined
    ? privateOptions.find((o) => o.type === type && o.options.index === parseInt(widgetIndex, 10))?.options
    : privateOptions;
}
