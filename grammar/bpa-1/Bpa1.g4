grammar Bpa1;

// Profile bpa-1: Edit Data body syntax, followed by the profile contract.
// Resolve EditData from grammar/EditData.g4. The inherited program rule consumes EOF.
// XPath and Groovy source have separate language boundaries.
import EditData;

statement
    : assignment
    | conditional
    | iteration
    | jump
    | branch
    | call
    | declaration
    | invocation
    | mapOperation
    | termination
    | defaultValue
    | labelStatement
    | editBlock
    ;
