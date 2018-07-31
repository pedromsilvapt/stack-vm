import { ValueType, Value } from "../Instruction";
import { StackVM } from "../StackVM";
import { Action } from "../Action";

export class PaddAction extends Action {
    parameters : ValueType[] = [];

    setup ( vm : StackVM ) {
        vm.actions.set( 'padd', this );
    }

    execute ( vm : StackVM, name : string, parameters : Value[] ) {
        const offset : Value<number> = vm.operands.pop();

        const address : Value<number> = vm.operands.pop();

        this.expect( offset, ValueType.Integer );
        this.expect( address, [ ValueType.AddressCode, ValueType.AddressHeap, ValueType.AddressStack, ValueType.AddressString ] );

        vm.operands.push(
            vm.valuesPool.acquire( address.type, address.value + offset.value )
        );

        vm.valuesPool.free( offset );
        vm.valuesPool.free( address );
    }
}