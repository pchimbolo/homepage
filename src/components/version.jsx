import { compareVersions, validate } from "compare-versions";
import cache from "memory-cache";
import { useTranslation } from "next-i18next";
import { MdNewReleases } from "react-icons/md";
import useSWR from "swr";

const LATEST_RELEASE_CACHE_KEY = "latestRelease";

export default function Version({ disableUpdateCheck = false }) {
  const { t, i18n } = useTranslation();

  const buildTime = process.env.NEXT_PUBLIC_BUILDTIME?.length
    ? process.env.NEXT_PUBLIC_BUILDTIME
    : new Date().toISOString();
  const revision = process.env.NEXT_PUBLIC_REVISION?.length ? process.env.NEXT_PUBLIC_REVISION : "dev";
  const version = process.env.NEXT_PUBLIC_VERSION?.length ? process.env.NEXT_PUBLIC_VERSION : "dev";

  // use Intl.DateTimeFormat to format the date
  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date));
  };

  let latestRelease = cache.get(LATEST_RELEASE_CACHE_KEY);

  const { data: releaseData } = useSWR(latestRelease || disableUpdateCheck ? null : "/api/releases");

  if (releaseData) {
    latestRelease = releaseData?.[0];
    // cache the latest release for 1h
    cache.put(LATEST_RELEASE_CACHE_KEY, latestRelease, 3600000);
  }

  const versionText = `${version} (${revision.substring(0, 7)}, ${formatDate(buildTime)})`;

  // Only link to an upstream release when this is a real release tag. Custom/fork
  // builds (e.g. "pmc-custom") have no upstream tag, so link to a configured source
  // URL (NEXT_PUBLIC_SOURCE_URL) if provided, otherwise show plain text.
  const sourceUrl = process.env.NEXT_PUBLIC_SOURCE_URL?.length ? process.env.NEXT_PUBLIC_SOURCE_URL : null;
  const versionHref = validate(version)
    ? `https://github.com/gethomepage/homepage/releases/tag/${version}`
    : sourceUrl;

  return (
    <div id="version" className="flex flex-row items-center">
      <span className="text-xs text-theme-500 dark:text-theme-400">
        {versionHref ? (
          <a
            href={versionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-theme-500 dark:text-theme-400 flex flex-row items-center"
          >
            {versionText}
          </a>
        ) : (
          <>{versionText}</>
        )}
      </span>
      {!validate(version)
        ? null
        : latestRelease &&
          compareVersions(latestRelease.tag_name, version) > 0 && (
            <a
              href={latestRelease.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs text-theme-500 dark:text-theme-400 flex flex-row items-center"
            >
              <MdNewReleases className="mr-1" /> {t("Update Available")}
            </a>
          )}
    </div>
  );
}
