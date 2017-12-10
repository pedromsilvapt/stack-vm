import * as P from 'parsimmon';
import { Instruction, Value, ValueType } from './Instruction';
import { parse } from 'url';
import { digit } from 'parsimmon';
import { inspect } from 'util';

const optional = <T>( parser : P.Parser<T> ) => parser.atMost( 1 ).map( t => t.length ? t[ 0 ] : null );

export class Parser {
    static parse ( script : string ) : Instruction[] {
        return new Parser().parse( script );
    }

    digit : P.Parser<number> = P.regexp( /[0-9]/ ).map( x => +x );

    alpha : P.Parser<string> = P.regexp( /[a-zA-Z]/ );

    identifier : P.Parser<string> = P.seqMap( 
        P.alt( this.alpha, P.string( '_' ) ),
        P.alt( this.alpha, this.digit, P.oneOf( '_\'' ) ).many(),
        ( a, b ) => '' + a + b.join( '' )
    );

    integer : P.Parser<number> = P.seqMap( 
        optional( P.string( '-' ) ),
        this.digit.atLeast( 1 ),
        ( negative, digits ) => parseInt( ( negative ? '-' : '' ) + digits.join( '' ) )
    );

    float : P.Parser<number> = P.seqMap( 
        optional( P.string( '-' ) ),
        this.digit.atLeast( 1 ),
        P.seq( P.string( '.' ), this.digit.many() ),
        optional( P.seq( P.oneOf( '+-' ), optional( P.oneOf( '+-' ) ), this.digit.atLeast( 1 ) ) ),
        ( negative, digits, [ _, decimals ], exp ) => {
            let str = ( negative ? '-' : '' ) + digits.join( '' ) + '.' + decimals.join( '' ) ;

            if ( exp ) {
                const [ _, polarity, power ] = exp;

                str += polarity + power.join( '' );
            }

            return parseInt( str );
        }
    );

    string : P.Parser<string> = P.seqMap(
        P.string( '"' ),
        P.alt( 
            P.string( '\\\\' ).map( () => '\\' ),
            P.string( '\\"' ).map( () => '"' ),
            P.string( '\\r' ).map( () => '\r' ),
            P.string( '\\n' ).map( () => '\n' ),
            P.string( '\\t' ).map( () => '\t' ),
            P.noneOf( '"' )
        ).many(),
        P.string( '"' ),
        ( _, chars, __ ) => chars.join( '' )
    );

    comment : P.Parser<void> = P.regexp( /[ \t\r\n]*\/\/[^\n]*/ ).map( x => void 0 );

    label : P.Parser<string> = this.identifier.skip( P.string( ':' ) ).skip( optional( this.comment ) );

    parameters : P.Parser<Value[]> = P.alt(
        this.float.map( float => new Value( ValueType.Float, float ) ),
        this.integer.map( int => new Value( ValueType.Integer, int ) ),
        this.string.map( str => new Value( ValueType.String, str ) ),
        this.identifier.map( label => new Value( ValueType.AddressCode, label ) ),
    ).sepBy( P.oneOf( ' \t' ).atLeast( 1 ) );

    instruction : P.Parser<Instruction> = P.seqMap( 
        this.identifier,
        optional( P.oneOf( ' \t' ).atLeast( 1 ).then( this.parameters ) ),
        ( ident, par ) => new Instruction( ident, par || [] )
    ).skip( optional( this.comment ) );

    line : P.Parser<void | string | Instruction> = P.alt( this.comment, this.label, this.instruction );

    lineSeparator : P.Parser<string> = P.regexp( /[ \t]*/ ).then( P.regexp( /\r?\n/ ) ).skip( P.regexp( /[ \t\r\n]*/ ) );

    script : P.Parser<Instruction[]> = P.alt<void | string | Instruction>( this.comment, this.label, this.instruction )
        .sepBy( this.lineSeparator ).wrap( P.whitespace.many(), P.whitespace.many() ).map( blocks => {
            const instructions : Instruction[] = [];

            const labels : Map<string, number> = new Map;

            for ( let block of blocks.filter( b => !!b ) ) {
                if ( typeof block === 'string' ) {
                    labels.set( block, instructions.length );
                } else if ( block instanceof Instruction ) {
                    instructions.push( block );
                }
            }

            for ( let instr of instructions ) {
                for ( let [ index, parameter ] of instr.parameters.entries() ) {
                    if ( parameter.type === ValueType.AddressCode ) {
                        if ( !labels.has( parameter.value ) ) {
                            throw new Error( `Referencing label "${ parameter.value }" that does not exist.` );
                        }

                        parameter.value = labels.get( parameter.value );
                    }
                }
            }

            return instructions;
         } );

    parse ( script : string ) {
        return this.script.tryParse( script );
    }
}

export class StringLikeArray<T = any> {
    tokens : T[] = [];

    constructor ( from : T[] ) {
        console.log( 1, from );

        for ( let item of from ) {
            this.tokens.push( item );
        }
    }

    charAt ( index : number ) : T {
        return this[ index ];
    }

    slice ( start : number, end ?: number ) {
        return new StringLikeArray( this.tokens.slice( start, end ) );
    }
}