
interface MoodEntry {
  mood: number;
  reflection: string;
  created_at: string;
}

interface CrisisFlag {
  type: 'extended_low' | 'rapid_cycling' | 'concerning_text' | 'missing_entries';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  entries_affected?: MoodEntry[];
}


const CONCERNING_KEYWORDS = [
  
  'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
  'hurt myself', 'self harm', 'cut myself', 'overdose',
  
  
  'no point', 'hopeless', 'worthless', 'burden', 'everyone hates me',
  'can\'t take it', 'give up', 'no way out', 'trapped',
  
  
  'can\'t get out of bed', 'sleeping all day', 'not eating', 'everything hurts',
  'numb', 'empty inside', 'dead inside'
];

const RAPID_CYCLING_KEYWORDS = [
  'manic', 'can\'t sleep', 'racing thoughts', 'unstoppable', 'invincible',
  'spending spree', 'talking fast', 'euphoric', 'grandiose'
];

export class CrisisDetectionService {
  static analyzeMoodPatterns(entries: MoodEntry[]): CrisisFlag[] {
    const flags: CrisisFlag[] = [];
    
    if (entries.length === 0) return flags;
    
   
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    
    const extendedLowFlag = this.checkExtendedLowMood(sortedEntries);
    if (extendedLowFlag) flags.push(extendedLowFlag);
    
    
    const rapidCyclingFlag = this.checkRapidCycling(sortedEntries);
    if (rapidCyclingFlag) flags.push(rapidCyclingFlag);
    
   
    const textFlags = this.analyzeConcerningText(sortedEntries);
    flags.push(...textFlags);
    
    
    const missingEntriesFlag = this.checkMissingEntries(sortedEntries);
    if (missingEntriesFlag) flags.push(missingEntriesFlag);
    
    return flags;
  }
  
  private static checkExtendedLowMood(entries: MoodEntry[]): CrisisFlag | null {
    const recentEntries = entries.slice(0, 7); 
    const lowMoodEntries = recentEntries.filter(entry => entry.mood <= 2);
    
    if (lowMoodEntries.length >= 5) {
      return {
        type: 'extended_low',
        severity: lowMoodEntries.length >= 6 ? 'high' : 'medium',
        description: `${lowMoodEntries.length} out of last ${recentEntries.length} entries show very low mood`,
        recommendation: 'Consider reaching out to a mental health professional or trusted person',
        entries_affected: lowMoodEntries
      };
    }
    
    return null;
  }
  
  private static checkRapidCycling(entries: MoodEntry[]): CrisisFlag | null {
    if (entries.length < 5) return null;
    
    const recent = entries.slice(0, 5);
    let volatility = 0;
    
    for (let i = 0; i < recent.length - 1; i++) {
      volatility += Math.abs(recent[i].mood - recent[i + 1].mood);
    }
    
    const avgVolatility = volatility / (recent.length - 1);
    
    
    const hasRapidCyclingText = recent.some(entry => 
      RAPID_CYCLING_KEYWORDS.some(keyword => 
        entry.reflection.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (avgVolatility > 3 || hasRapidCyclingText) {
      return {
        type: 'rapid_cycling',
        severity: avgVolatility > 4 ? 'high' : 'medium',
        description: 'Significant mood swings detected in recent entries',
        recommendation: 'Rapid mood changes may indicate need for medical evaluation',
        entries_affected: recent
      };
    }
    
    return null;
  }
  
  private static analyzeConcerningText(entries: MoodEntry[]): CrisisFlag[] {
    const flags: CrisisFlag[] = [];
    const recentEntries = entries.slice(0, 10); 
    
    for (const entry of recentEntries) {
      const concerningWords = CONCERNING_KEYWORDS.filter(keyword =>
        entry.reflection.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (concerningWords.length > 0) {
        flags.push({
          type: 'concerning_text',
          severity: this.assessTextSeverity(concerningWords),
          description: 'Entry contains concerning language',
          recommendation: 'Immediate support recommended - please reach out to someone you trust or a crisis helpline',
          entries_affected: [entry]
        });
      }
    }
    
    return flags;
  }
  
  private static checkMissingEntries(entries: MoodEntry[]): CrisisFlag | null {
    if (entries.length === 0) return null;
    
    const lastEntry = new Date(entries[0].created_at);
    const daysSinceLastEntry = Math.floor(
      (Date.now() - lastEntry.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastEntry > 5) {
      return {
        type: 'missing_entries',
        severity: daysSinceLastEntry > 10 ? 'medium' : 'low',
        description: `No mood entries for ${daysSinceLastEntry} days`,
        recommendation: 'Consider checking in - isolation can worsen mental health symptoms'
      };
    }
    
    return null;
  }
  
  private static assessTextSeverity(concerningWords: string[]): 'low' | 'medium' | 'high' {
    const highRiskWords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'overdose'];
    const hasHighRisk = concerningWords.some(word => 
      highRiskWords.some(highRisk => word.includes(highRisk))
    );
    
    if (hasHighRisk) return 'high';
    if (concerningWords.length > 2) return 'medium';
    return 'low';
  }
  
  static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
}