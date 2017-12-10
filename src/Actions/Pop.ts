import { Action } from "../Action";
import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";

export class PopAction extends Action {
    parameters : ValueType[] = [ ValueType.Integer ];

    setup ( vm : StackVM ) {
        vm.actions.set( 'pop', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : number = parameters[ 0 ].value;

        for ( let i = 0; i < value; i++ ) {
            vm.operands.pop();
        }
    }
}

export class PopNAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'popn', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const value : Value<number> = vm.operands.pop();

        this.expect( value, ValueType.Integer );

        vm.actions.get( 'pop' ).execute( vm, name, [ value ] );
    }
}
