grammar EditData;

// Shared Edit Data syntax. Engine profiles define the available operations and
// behavior; recognizing a form does not make it available in every profile.
// Structured interaction steps and Groovy source bodies are separate forms.
program: item* EOF;
item: COMMENT | disabled? label? statement ';';
disabled: '*DISABLED*';
label: labelName ':';
labelName: WORD | INTEGER | keyword;
keyword: 'move' | 'to' | 'if' | 'for' | 'in' | 'goto' | 'branch' | 'default' | 'as' | 'label' | 'terminate' | 'with' | 'error' | 'map' | 'using' | 'target' | 'bpa' | 'page' | 'popup' | 'null' | 'evaluate' | 'escape' | 'performScript' | 'transferControl' | 'navigate' | 'navigateAndReloadDashboard' | declarationName | mapName | 'invokeBO' | 'invokeBS' | 'invokeSS' | 'invokeGroovy' | action | 'warn' | 'suppress' | 'asError' | 'element' | 'edit' | 'data';
statement
    : assignment
    | conditional
    | iteration
    | jump
    | branch
    | call
    | declaration
    | invocation
    | groovyInvocation
    | mapOperation
    | termination
    | defaultValue
    | labelStatement
    | editBlock
    ;
assignment: 'move' sourceValue 'to' destination;
sourceValue: 'null' | operand | GLOBAL | ('evaluate' | 'escape') '(' (operand | GLOBAL) ')';
destination: VARIABLE | GLOBAL | quoted | 'evaluate' '(' operand ')';
conditional: 'if' '(' quoted ')' item* ('else' item*)? 'end-if';
iteration: 'for' '(' VARIABLE 'in' ('evaluate' '(' quoted ')' | quoted) ')' item* 'end-for';
jump: 'goto' labelName;
branch: 'branch' '(' quoted ')' 'goto' labelName ('else' labelName)?;
call: ('performScript' | 'transferControl' | 'navigate' | 'navigateAndReloadDashboard') operand;
declaration: declarationName operand 'as' LITERAL;
declarationName: 'declareBO' | 'declareBOWithBOGroup' | 'declareBS' | 'declareSS' | 'declareDA' | 'declareMap';
invocation
    : 'invokeBO' operand 'using' quoted 'for' action warning?
    | ('invokeBS' | 'invokeSS') operand 'using' quoted warning?
    ;
groovyInvocation: 'invokeGroovy' operand;
action: 'read' | 'readWithoutVersion' | 'add' | 'fastAdd' | 'update' | 'fastUpdate' | 'delete' | 'replace';
warning: 'with' 'warn' ('suppress' | 'popup' | 'asError')? | ('suppress' | 'popup' | 'asError');
mapOperation: mapName operand ('using' quoted)? ('target' ('bpa' | 'page' | 'popup'))?;
mapName: 'invokeMap' | 'generateBOEditMap' | 'generateBSEditMap' | 'generateSSEditMap' | 'generateDAEditMap';
termination: 'terminate' ('with' 'error' '(' INTEGER ',' INTEGER substitution* ('element' '=' operand)? ')' | 'with' 'map' operand 'using' operand)?;
substitution: '%' INTEGER '=' quoted;
defaultValue: 'default' VARIABLE ('as' LITERAL)?;
labelStatement: 'label' (quoted | keyword)?;
editBlock: 'edit' 'data' item* 'end-edit';
operand: VARIABLE | quoted;
quoted: LITERAL | EXPRESSION;
GLOBAL: '$$' [a-zA-Z] [a-zA-Z_0-9.-]*;
VARIABLE: '$' [a-zA-Z] [a-zA-Z_0-9.-]*;
INTEGER: [0-9]+;
RESERVED: 'STATEMENT_BLOCK';
WORD: [a-zA-Z] [a-zA-Z_0-9.]*;
LITERAL: '\'' (ESCAPE | ~['\\])* '\'';
EXPRESSION: '"' (ESCAPE | ~["\\])* '"';
fragment ESCAPE: '\\' ([nrtbf"'\\] | 'u'+ [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] | [0-3] [0-7]? [0-7]? | [4-7] [0-7]?);
COMMENT: '//' ~[\r\n]*;
SPACE: [ \t\r\n]+ -> skip;
