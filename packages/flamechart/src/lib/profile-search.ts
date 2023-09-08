import { Frame, CallTreeNode, Profile } from './profile'
import { FuzzyMatch, fuzzyMatchStrings } from './fuzzy-find'
import { Rect } from './math'
import { FlamechartImage } from './flamechart-image'
import { FlamechartFrame } from './flamechart'

export enum FlamechartType {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
}

export interface ProfileSearchEngine {
  getMatchForFrame(frame: FlamechartFrame): FuzzyMatch | null
}

export class ProfileNameSearchEngine implements ProfileSearchEngine {
  constructor(readonly searchQuery: string) {}

  private cache = new WeakMap<Frame, FuzzyMatch | null>()

  getMatchForFrame(framechartFrame: FlamechartFrame): FuzzyMatch | null {
    const frame = framechartFrame.node.frame
    const cachedMatch = this.cache.get(frame)
    if (cachedMatch !== undefined) {
      return cachedMatch
    }
    const match = fuzzyMatchStrings(FlamechartImage.parseStrWithImageLabel(frame.name).str, this.searchQuery)
    this.cache.set(frame, match)
    return match
  }

  getMatches(profile: Profile): Map<Frame, FuzzyMatch> {
    const matches = new Map()
    profile.forEachFrame((frame) => {
      const match = fuzzyMatchStrings(FlamechartImage.parseStrWithImageLabel(frame.name).str, this.searchQuery)
      if (match == null) return
      matches!.set(frame, match)
    })
    return matches
  }
}

export class ProfileFileSearchEngine implements ProfileSearchEngine {
  constructor(readonly searchQuery: string) {}

  private cache = new WeakMap<Frame, FuzzyMatch | null>()

  getMatchForFrame(framechartFrame: FlamechartFrame): FuzzyMatch | null {
    const frame = framechartFrame.node.frame
    const cachedMatch = this.cache.get(frame)
    if (cachedMatch !== undefined) {
      return cachedMatch
    }
    const match = frame.file ? fuzzyMatchStrings(frame.file, this.searchQuery) : null
    if (match?.matchedRanges) {
      match.matchedRanges = []
    }
    this.cache.set(frame, match)
    return match
  }
}

export class ProfileFrameKeySearch implements ProfileSearchEngine {
  constructor(readonly frameKey: string, readonly parentKeys?: string[]) {}

  getMatchForFrame(framechartFrame: FlamechartFrame): FuzzyMatch | null {
    if (this.frameKey && framechartFrame.node.frame.key === this.frameKey) {
      // match for parent stacks
      if (this.parentKeys?.length) {
        let parentNode = framechartFrame.node.parent
        for (const parentKey of this.parentKeys) {
          if (parentNode?.frame.key === parentKey) {
            parentNode = parentNode.parent
          } else {
            return null
          }
        }
      }
      return {
        matchedRanges: [],
        score: framechartFrame.node.getTotalWeight(),
      }
    }
    return null
  }
}

export interface FlamechartSearchMatch {
  configSpaceBounds: Rect
  node: CallTreeNode
}
