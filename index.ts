import { readdir, stat } from "fs/promises";
import { homedir, platform } from "os";
import { join } from "path";
import { ReadableStream } from "stream/web";

const cachePaths: {
	name: string;
	paths: { [_ in NodeJS.Platform]?: string };
}[] = [
	{
		name: "bower",
		paths: {
			linux: ".cache/bower/packages",
			win32: "AppData/Local/bower/packages",
		},
	},
	{
		name: "bun",
		paths: {
			linux: ".bun/install/cache",
		},
	},
	{
		name: "corepack",
		paths: {
			linux: ".cache/node/corepack",
			win32: "AppData/Local/node/corepack",
		},
	},
	{
		name: "deno",
		paths: {
			linux: ".cache/deno",
			win32: "AppData/Local/deno",
			darwin: "Library/Caches/deno",
		},
	},
	{
		name: "npm",
		paths: {
			linux: ".npm/_cacache",
			win32: "AppData/Local/npm-cache/_cacache",
		},
	},
	{
		name: "pnpm",
		paths: {
			linux: ".local/share/pnpm/store",
			win32: "AppData/Local/pnpm/store",
			darwin: "Library/pnpm/store",
		},
	},
	{
		name: "yarn classic",
		paths: {
			linux: ".cache/yarn",
			win32: "AppData/Local/Yarn/Cache",
			darwin: "Library/Caches/Yarn",
		},
	},
	{
		name: "yarn modern",
		paths: {
			linux: ".local/share/yarn/berry/cache",
			win32: "AppData/Local/Yarn/Berry/cache",
			darwin: ".yarn/berry/cache",
		},
	},
];

async function size(path: string): Promise<number> {
	const stats = await stat(path);

	if (stats.isDirectory()) {
		const dirPaths = await readdir(path);
		const dirResults = await Promise.allSettled(
			dirPaths.map((subpath) => size(join(path, subpath))),
		);
		const dirSizes = dirResults.map((result) =>
			result.status === "fulfilled" ? result.value : 0,
		);
		return dirSizes.reduce((i, size) => i + size, 0);
	} else {
		return stats.size;
	}
}

export default function cacheinfo() {
	return new ReadableStream<[name: string, size: number]>({
		start(controller) {
			let remaining = cachePaths.length;

			cachePaths.forEach(async ({ name, paths }) => {
				try {
					const cachePath = join(homedir(), paths[platform()] ?? paths.linux!);
					controller.enqueue([name, await size(cachePath)]);
				} catch (error) {
					if (
						!(
							error instanceof Error &&
							"code" in error &&
							error.code === "ENOENT"
						)
					) {
						controller.error(error);
					}
				} finally {
					if (!--remaining) controller.close();
				}
			});
		},
	});
}
