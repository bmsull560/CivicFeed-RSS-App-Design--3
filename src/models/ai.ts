/**
 * AI research protocol models.
 *
 * Types for the evidence-grounded AI assistant: queries are answered with
 * citations, explicit uncertainty, and a clearly labeled model synthesis
 * that is always separated from documented evidence.
 */

import type { Claim, Source } from "./evidence";
import type { Entity } from "./entities";
import type { TimelineEvent } from "./timeline";
import type { Topic } from "./topics";

/** A question posed to the AI research assistant. */
export interface AIQuery {
  /** The natural-language question. */
  question: string;
  /** Optional scoping context (e.g., a Topic ID or Entity ID). */
  context?: string;
  /** Maximum number of sources to retrieve and cite. */
  maxSources?: number;
}

/**
 * The assistant's answer. Model-generated text (`answer`,
 * `modelSynthesis`) is structurally separated from sourced evidence so
 * the UI can label it as such.
 */
export interface AIResponse {
  /** The direct answer to the question (model-generated). */
  answer: string;
  /** Claims from the knowledge base used as evidence. */
  evidence: Claim[];
  /** Sources cited in support of the answer. */
  sources: Source[];
  /** Aspects of the answer the model is uncertain about. */
  uncertainty: string[];
  /** Evidence that would strengthen the answer but could not be found. */
  missingEvidence: string[];
  /** Model-generated synthesis; always clearly labeled in the UI. */
  modelSynthesis: string;
}

/** Retrieved context supplied to the model for grounded answering. */
export interface RetrievalContext {
  /** Relevant topics. */
  topics?: Topic[];
  /** Relevant knowledge-graph entities. */
  entities?: Entity[];
  /** Relevant source documents. */
  sources?: Source[];
  /** Relevant timeline events. */
  events?: TimelineEvent[];
  /** Relevant documented claims. */
  claims?: Claim[];
}
